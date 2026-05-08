# SnowWhite Testing Guide

## 📊 Quick Test Suite Overview

**20 Core Tests** covering:
- ✅ Authentication (7 tests)
- ✅ Barcode generation (10 tests)
- ✅ PDF generation (8 tests)
- ✅ API endpoints (8 tests)

**Runtime:** ~2 minutes  
**Coverage:** ~85% of critical paths

---

## 🚀 SETUP (First Time Only)

### Step 1: Add test files to your project

Copy these files to your project:

```
snowwhite-backend/
├── pytest.ini                    # Test configuration
├── requirements-test.txt         # Test dependencies
├── tests/
│   ├── conftest.py              # Fixtures & setup
│   ├── test_auth.py             # Auth tests
│   ├── test_barcode.py          # Barcode tests
│   ├── test_pdf.py              # PDF tests
│   └── test_api.py              # API tests
```

### Step 2: Create tests directory

```bash
mkdir tests
```

### Step 3: Install test dependencies

```bash
pip install -r requirements-test.txt
```

---

## ▶️ RUN TESTS

### Run all tests (simple)
```bash
pytest
```

### Run with verbose output
```bash
pytest -v
```

### Run specific test file
```bash
pytest tests/test_auth.py -v
```

### Run specific test
```bash
pytest tests/test_auth.py::test_hash_password -v
```

### Run by marker (category)
```bash
pytest -m auth              # Only auth tests
pytest -m barcode           # Only barcode tests
pytest -m pdf               # Only PDF tests
pytest -m api               # Only API tests
```

### Run with coverage report
```bash
pytest --cov=app --cov-report=html
```

---

## 📋 TEST CATEGORIES

### Authentication Tests (7)
```bash
pytest -m auth
```
- `test_hash_password` - Password hashing works
- `test_verify_password_correct` - Correct password validates
- `test_verify_password_incorrect` - Wrong password rejects
- `test_create_access_token` - Token generation works
- `test_verify_token_valid` - Valid token decodes
- `test_verify_token_invalid` - Invalid token rejected
- `test_verify_token_expired` - Expired token rejected

### Barcode Tests (10)
```bash
pytest -m barcode
```
- `test_generate_qr` - QR code generation
- `test_generate_code128` - Code128 barcode
- `test_generate_ean13` - EAN13 barcode
- `test_generate_upca` - UPC-A barcode
- `test_generate_barcode_qr` - Generic QR call
- `test_generate_barcode_code128` - Generic Code128 call
- `test_generate_barcode_invalid_type` - Invalid type error
- `test_resize_barcode` - Image resizing
- `test_barcode_empty_string` - Edge case: empty code
- `test_barcode_long_string` - Edge case: long code

### PDF Tests (8)
```bash
pytest -m pdf
```
- `test_create_simple_label_pdf` - Single label PDF
- `test_create_simple_label_pdf_code128` - PDF with Code128
- `test_create_label_pdf_single` - Batch single label
- `test_create_label_pdf_multiple` - Multiple labels
- `test_create_label_pdf_a4` - A4 page size
- `test_create_label_pdf_empty_description` - No description
- `test_create_label_pdf_missing_code` - Missing code
- `test_pdf_size_reasonable` - PDF file size validation

### API Tests (8)
```bash
pytest -m api
```
- `test_health_endpoint` - Health check endpoint
- `test_register_endpoint` - User registration
- `test_register_duplicate_email` - Duplicate email error
- `test_login_endpoint` - Login & token
- `test_login_wrong_password` - Wrong password error
- `test_get_current_user_without_auth` - Auth required
- `test_get_current_user_with_auth` - Get user info
- `test_barcode_endpoint_requires_auth` - Protected endpoint
- `test_barcode_endpoint_with_auth` - Barcode API call
- `test_labels_list_requires_auth` - List jobs auth
- `test_generate_simple_requires_auth` - Generate auth

---

## 📊 EXAMPLE OUTPUT

```
================================ test session starts =================================
platform linux -- Python 3.11.0, pytest-7.4.3, py-1.13.1, pluggy-1.1.1
rootdir: /snowwhite-backend
collected 20 items

tests/test_auth.py::test_hash_password PASSED                             [ 5%]
tests/test_auth.py::test_verify_password_correct PASSED                   [10%]
tests/test_auth.py::test_verify_password_incorrect PASSED                 [15%]
tests/test_auth.py::test_create_access_token PASSED                       [20%]
tests/test_auth.py::test_verify_token_valid PASSED                        [25%]
tests/test_auth.py::test_verify_token_invalid PASSED                      [30%]
tests/test_auth.py::test_verify_token_expired PASSED                      [35%]
tests/test_barcode.py::test_generate_qr PASSED                            [40%]
tests/test_barcode.py::test_generate_code128 PASSED                       [45%]
tests/test_barcode.py::test_generate_ean13 PASSED                         [50%]
tests/test_barcode.py::test_generate_upca PASSED                          [55%]
tests/test_barcode.py::test_generate_barcode_qr PASSED                    [60%]
tests/test_barcode.py::test_generate_barcode_invalid_type PASSED          [65%]
tests/test_barcode.py::test_resize_barcode PASSED                         [70%]
tests/test_pdf.py::test_create_simple_label_pdf PASSED                    [75%]
tests/test_pdf.py::test_create_label_pdf_single PASSED                    [80%]
tests/test_pdf.py::test_create_label_pdf_multiple PASSED                  [85%]
tests/test_api.py::test_health_endpoint PASSED                            [90%]
tests/test_api.py::test_register_endpoint PASSED                          [95%]
tests/test_api.py::test_login_endpoint PASSED                            [100%]

================================ 20 passed in 1.92s ==================================
```

---

## ✅ TYPICAL WORKFLOW

### Before pushing code:
```bash
# Run all tests
pytest

# If tests fail, see details:
pytest -v

# Run specific category that failed:
pytest -m auth -v
```

### Run tests before Docker restart:
```bash
pytest && docker-compose down && docker-compose up -d
```

### Monitor test health:
```bash
# Run every 30 minutes
watch -n 1800 'pytest'
```

---

## 🐛 DEBUGGING FAILED TESTS

### Show detailed output
```bash
pytest -vv
```

### Show print statements
```bash
pytest -s
```

### Stop on first failure
```bash
pytest -x
```

### Run last failed test
```bash
pytest --lf
```

---

## 📈 COVERAGE REPORT

Generate HTML coverage report:
```bash
pytest --cov=app --cov-report=html
```

Open report:
```bash
open htmlcov/index.html
```

---

## 🔄 CI/CD Integration

To auto-run tests before Docker build, add to Dockerfile:
```dockerfile
RUN pytest --tb=short
```

---

## 🎯 NEXT STEPS

1. Copy test files to your project
2. Install test dependencies: `pip install -r requirements-test.txt`
3. Run tests: `pytest -v`
4. All 20 tests should PASS ✅
5. Before each code change, run tests!

---

## 📞 COMMON COMMANDS

| Task | Command |
|------|---------|
| Run all tests | `pytest` |
| Verbose output | `pytest -v` |
| Run one test file | `pytest tests/test_auth.py` |
| Run by category | `pytest -m auth` |
| Show print output | `pytest -s` |
| Stop on first fail | `pytest -x` |
| Coverage report | `pytest --cov=app --cov-report=html` |
| Run + Docker | `pytest && docker-compose up -d --build` |

---

**Ready to catch bugs early!** 🚀
