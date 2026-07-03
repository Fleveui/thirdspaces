#!/usr/bin/env python3
# Excel Database Importer for Community Space Sharing Platform
# → see DECISIONS.md #12 (Excel Import Strategy)
#
# Purpose: Import data from database edt.xlsx into SQLite
# Usage: python3 import_excel.py
#
# This script reads the Excel file structure:
#   - personal account + buissiness account → personal_account table
#   - space → spaces table
#   - Booking → booking table
#   - item photo → space_photo table
#
# Note: Currently the Excel file has schema but no data rows.
# When data is added, run this script to populate the database.

import pandas as pd
import os
from datetime import datetime
from sqlalchemy.orm import Session
from models import (
    Base, PersonalAccount, Space, Booking, SpacePhoto
)
from database import engine, SessionLocal
import config

# Path to Excel file (relative to project root)
EXCEL_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database edt.xlsx")

def import_personal_accounts(db: Session):
    """
    Import personal accounts from Excel sheet 'personal account'
    
    Excel columns: ID, NAME, SURNAME, E-MAIL, PASSWORLD
    Maps to: PersonalAccount table
    
    Note: Passwords from Excel are NOT hashed here (data-only import).
    For security, passwords should be hashed via registration flow.
    """
    print("📥 Importing personal accounts...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="personal account")
    
    if df.empty:
        print("   ⚠️  No personal accounts data found")
        return
    
    count = 0
    for _, row in df.iterrows():
        # Skip rows with missing ID
        if pd.isna(row.get('ID')):
            continue
        
        account = PersonalAccount(
            id=str(row['ID']),
            name=str(row.get('NAME', '')).strip(),
            surname=str(row.get('SURNAME', '')).strip(),
            email=str(row.get('E-MAIL', '')).strip(),
            password_hash=None,  # Should be set via registration, not imported
            created_at=datetime.utcnow()
        )
        db.add(account)
        count += 1
    
    db.commit()
    print(f"   ✅ Imported {count} personal accounts")

def import_business_accounts(db: Session):
    """
    Import business accounts from Excel sheet 'buissiness account' into personal_account.

    Excel columns: ID, NAME, SURNAME, COMPANY, COMPANY E-MAIL
    Company name is ignored; COMPANY E-MAIL maps to email.
    """
    print("📥 Importing business accounts (as personal profiles)...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="buissiness account")
    
    if df.empty:
        print("   ⚠️  No business accounts data found")
        return
    
    count = 0
    for _, row in df.iterrows():
        if pd.isna(row.get('ID')):
            continue
        
        account = PersonalAccount(
            id=str(row['ID']),
            name=str(row.get('NAME', '')).strip(),
            surname=str(row.get('SURNAME', '')).strip(),
            email=str(row.get('COMPANY E-MAIL', '')).strip(),
            password_hash=None,
            created_at=datetime.utcnow()
        )
        db.add(account)
        count += 1
    
    db.commit()
    print(f"   ✅ Imported {count} business profiles")

def import_spaces(db: Session):
    """
    Import spaces from Excel sheet 'space'
    
    Excel columns: ID, NAME, OWNER, M2, OUTDOOR/INDOOR, CATEGORY, AVAILABILITY, DEPOSIT NEEDED, LOCATION
    Maps to: Space table
    """
    print("📥 Importing spaces...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="space")
    
    if df.empty:
        print("   ⚠️  No spaces data found")
        return
    
    count = 0
    for _, row in df.iterrows():
        if pd.isna(row.get('ID')):
            continue
        
        # Parse OUTDOOR/INDOOR to boolean
        outdoor_indoor = str(row.get('OUTDOOR/INDOOR', '')).lower()
        is_outdoor = outdoor_indoor == 'outdoor' if outdoor_indoor else None
        
        space = Space(
            id=str(row['ID']),
            name=str(row.get('NAME', '')).strip(),
            owner_id=str(row.get('OWNER', '')).strip(),
            area_m2=float(row['M2']) if pd.notna(row.get('M2')) else None,
            is_outdoor=is_outdoor,
            category=str(row.get('CATEGORY', '')).strip() if pd.notna(row.get('CATEGORY')) else None,
            availability=str(row.get('AVAILABILITY', '')).strip() if pd.notna(row.get('AVAILABILITY')) else None,
            deposit_needed=float(row['DEPOSIT NEEDED ']) if pd.notna(row.get('DEPOSIT NEEDED ')) else None,
            location=str(row.get('LOCATION', '')).strip() if pd.notna(row.get('LOCATION')) else None,
            created_at=datetime.utcnow()
        )
        db.add(space)
        count += 1
    
    db.commit()
    print(f"   ✅ Imported {count} spaces")

def import_bookings(db: Session):
    """
    Import bookings from Excel sheet 'Booking'
    
    Excel columns: BOOKING ID, ITEM ID, BORROWER ID, START DATE, END DATE, STATUS
    Maps to: Booking table
    
    Note: START DATE and END DATE are parsed as datetime objects
    """
    print("📥 Importing bookings...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="Booking")
    
    if df.empty:
        print("   ⚠️  No bookings data found")
        return
    
    count = 0
    for _, row in df.iterrows():
        if pd.isna(row.get('BOOKING ID')):
            continue
        
        booking = Booking(
            booking_id=str(row['BOOKING ID']),
            space_id=str(row.get('ITEM ID', '')).strip(),
            borrower_id=str(row.get('BORROWER ID', '')).strip(),
            start_date=pd.to_datetime(row['START DATE']) if pd.notna(row.get('START DATE')) else None,
            end_date=pd.to_datetime(row['END DATE']) if pd.notna(row.get('END DATE')) else None,
            status=str(row.get('STATUS', 'pending')).strip().lower(),
            created_at=datetime.utcnow()
        )
        db.add(booking)
        count += 1
    
    db.commit()
    print(f"   ✅ Imported {count} bookings")

def import_space_photos(db: Session):
    """
    Import space photos from Excel sheet 'item photo'
    
    Excel columns: ID, ITEM ID, IMAGE, POSITION
    Maps to: SpacePhoto table
    """
    print("📥 Importing space photos...")
    df = pd.read_excel(EXCEL_FILE, sheet_name="item photo")
    
    if df.empty:
        print("   ⚠️  No photos data found")
        return
    
    count = 0
    for _, row in df.iterrows():
        # Note: Column name is 'ID ' (with trailing space)
        id_col = 'ID ' if 'ID ' in df.columns else 'ID'
        if pd.isna(row.get(id_col)):
            continue
        
        photo = SpacePhoto(
            photo_id=str(row[id_col]),
            space_id=str(row.get('ITEM ID', '')).strip(),
            image_url=str(row.get('IMAGE', '')).strip() if pd.notna(row.get('IMAGE')) else None,
            position=int(row['POSITION']) if pd.notna(row.get('POSITION')) else None,
            created_at=datetime.utcnow()
        )
        db.add(photo)
        count += 1
    
    db.commit()
    print(f"   ✅ Imported {count} photos")

def clear_database(db: Session):
    """Clear all tables before import (optional)"""
    print("🗑️  Clearing existing database...")
    try:
        db.query(SpacePhoto).delete()
        db.query(Booking).delete()
        db.query(Space).delete()
        db.query(PersonalAccount).delete()
        db.commit()
        print("   ✅ Database cleared")
    except Exception as e:
        print(f"   ⚠️  Could not clear database: {e}")
        db.rollback()

def main():
    """Run the complete import process"""
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ Excel file not found: {EXCEL_FILE}")
        return
    
    print("\n" + "="*60)
    print("Community Space Sharing Platform - Excel Import")
    print("="*60 + "\n")
    
    # Create database tables if they don't exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Optionally clear existing data
        # clear_database(db)
        
        # Import all data
        import_personal_accounts(db)
        import_business_accounts(db)
        import_spaces(db)
        import_bookings(db)
        import_space_photos(db)
        
        print("\n" + "="*60)
        print("✅ Import completed successfully!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()

if __name__ == "__main__":
    main()
