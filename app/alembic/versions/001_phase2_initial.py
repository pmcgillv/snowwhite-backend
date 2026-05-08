"""Phase 2 Initial Schema"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.create_table(
        'import_jobs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('template_id', sa.String(36), nullable=False),
        sa.Column('file_name', sa.String(255)),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('created_at', sa.DateTime, default=sa.func.now()),
    )
    op.create_index('idx_jobs_template', 'import_jobs', ['template_id'])

def downgrade():
    op.drop_table('import_jobs')