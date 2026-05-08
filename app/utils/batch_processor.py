"""Background worker for batch label processing"""
import threading
import time
import csv
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.database_models import BatchJob
from app.utils.pdf import create_label_pdf
import logging

logger = logging.getLogger(__name__)


class BatchProcessor:
    """Background processor for batch label jobs"""
    
    def __init__(self):
        self.running = False
        self.db: Session = None
    
    def start(self):
        """Start the background processor in a separate thread"""
        self.running = True
        thread = threading.Thread(target=self.run, daemon=True)
        thread.start()
        logger.info("Batch processor started")
    
    def stop(self):
        """Stop the background processor"""
        self.running = False
        logger.info("Batch processor stopped")
    
    def run(self):
        """Main processing loop"""
        while self.running:
            try:
                self.db = SessionLocal()
                
                # Find next pending job
                job = self.db.query(BatchJob).filter(
                    BatchJob.status == "pending"
                ).order_by(BatchJob.created_at).first()
                
                if not job:
                    time.sleep(2)
                    continue
                
                # Process the job
                self.process_job(job)
                
            except Exception as e:
                logger.error(f"Error in batch processor: {str(e)}")
                time.sleep(5)
            finally:
                if self.db:
                    self.db.close()
    
    def process_job(self, job: BatchJob):
        """Process a single batch job"""
        try:
            job.status = "processing"
            job.started_at = datetime.utcnow()
            self.db.commit()
            logger.info(f"Started processing job {job.id}")
            
            # Read CSV file
            csv_path = f"/app/uploads/{job.id}.csv"
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            # Parse CSV
            labels_data = []
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    labels_data.append({
                        "text": row.get("product_name", ""),
                        "code": row.get("code", ""),
                        "description": row.get("description", "")
                    })
            
            job.total_rows = len(labels_data)
            self.db.commit()
            
            # Update progress while generating PDF
            for i in range(0, len(labels_data), 100):
                job.processed_rows = min(i + 100, len(labels_data))
                job.progress_percent = int((job.processed_rows / len(labels_data)) * 100)
                self.db.commit()
                logger.info(f"Job {job.id}: {job.progress_percent}%")
                time.sleep(0.1)
            
            # Generate final PDF
            logger.info(f"Generating final PDF for job {job.id}")
            final_pdf = create_label_pdf(
                labels=labels_data,
                barcode_type=job.barcode_type,
                page_size=job.page_size,
                labels_per_page=job.labels_per_page
            )
            
            # Save output
            output_dir = "/app/uploads/outputs"
            os.makedirs(output_dir, exist_ok=True)
            
            output_filename = f"labels_{job.id}_{datetime.utcnow().timestamp()}.pdf"
            output_path = f"{output_dir}/{output_filename}"
            
            with open(output_path, 'wb') as f:
                f.write(final_pdf.getvalue())
            
            # Mark complete
            job.output_filename = output_filename
            job.output_path = output_path
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress_percent = 100
            self.db.commit()
            
            logger.info(f"Job {job.id} completed successfully")
            
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error(f"Job {job.id} failed: {str(e)}")


_processor = None


def start_batch_processor():
    """Start the global batch processor"""
    global _processor
    if _processor is None:
        _processor = BatchProcessor()
        _processor.start()


def stop_batch_processor():
    """Stop the global batch processor"""
    global _processor
    if _processor:
        _processor.stop()
