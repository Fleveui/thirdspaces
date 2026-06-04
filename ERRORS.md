# Errors Found and Fixed

This file documents all errors encountered during development and testing. It is part of the learning outcome — building software is iterative, and errors are normal.

**Status:** Initial build complete. Test results will be added as the system is run.

## Testing Notes

When you run `./start.sh` for the first time:
- If you encounter errors, note them below with:
  - **Error:** What happened
  - **Cause:** Why it happened
  - **Fix:** How we solved it
  - **Prevention:** How to avoid it in future

## Example Error Format

```
### Error #1: Module not found
**What:** `ModuleNotFoundError: No module named 'fastapi'`
**When:** Running `python main.py`
**Cause:** Python dependencies not installed
**Fix:** Ran `pip install -r requirements.txt`
**Prevention:** Docker automatically installs dependencies from requirements.txt
**Status:** Fixed ✓
```

---

## Recorded Errors

(None yet — check back after first run!)
