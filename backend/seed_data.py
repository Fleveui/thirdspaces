#!/usr/bin/env python3
# Seed Database with Demo Data
# Usage: python3 seed_data.py

from datetime import datetime, timedelta
from database import SessionLocal
from models import Space, Booking, BusinessAccount, PersonalAccount, SpacePhoto
import uuid

def seed_database():
    """Populate database with demo data"""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Booking).delete()
        db.query(SpacePhoto).delete()
        db.query(Space).delete()
        db.query(BusinessAccount).delete()
        db.query(PersonalAccount).delete()
        db.commit()
        print("✅ Cleared existing data")
        
        # Create demo business accounts (space owners)
        owner1_id = str(uuid.uuid4().hex)
        owner2_id = str(uuid.uuid4().hex)
        
        owner1 = BusinessAccount(
            id=owner1_id,
            name="Marco",
            surname="Rossi",
            company="Spazi Sostenibili",
            company_email="marco@spazisos.it",
            created_at=datetime.utcnow()
        )
        owner2 = BusinessAccount(
            id=owner2_id,
            name="Lucia",
            surname="Bianchi",
            company="Community Hub Milano",
            company_email="lucia@communityhub.it",
            created_at=datetime.utcnow()
        )
        db.add(owner1)
        db.add(owner2)
        db.commit()
        print("✅ Created 2 business accounts")
        
        # Create demo spaces
        spaces_data = [
            {
                "name": "Loft Luminoso - Navigli",
                "owner_id": owner1_id,
                "area_m2": 120.0,
                "is_outdoor": False,
                "category": "Loft",
                "availability": "Weekends",
                "deposit_needed": 500.0,
                "location": "Via Naviglio Grande, Milano"
            },
            {
                "name": "Terrazza Panoramica - Duomo",
                "owner_id": owner1_id,
                "area_m2": 80.0,
                "is_outdoor": True,
                "category": "Terrazza",
                "availability": "Flexible",
                "deposit_needed": 300.0,
                "location": "Piazza Duomo, Milano"
            },
            {
                "name": "Atelier Creativo - Lambrate",
                "owner_id": owner2_id,
                "area_m2": 150.0,
                "is_outdoor": False,
                "category": "Studio",
                "availability": "Weekdays 9-18",
                "deposit_needed": 400.0,
                "location": "Via Lambrertesca, Milano"
            },
            {
                "name": "Giardino Condiviso - Porta Romana",
                "owner_id": owner2_id,
                "area_m2": 200.0,
                "is_outdoor": True,
                "category": "Orto",
                "availability": "Daily",
                "deposit_needed": 200.0,
                "location": "Porta Romana, Milano"
            },
            {
                "name": "Sala Riunioni - Centrale",
                "owner_id": owner1_id,
                "area_m2": 60.0,
                "is_outdoor": False,
                "category": "Ufficio",
                "availability": "Hourly",
                "deposit_needed": 150.0,
                "location": "Via Torino, Milano"
            }
        ]
        
        created_spaces = []
        for space_data in spaces_data:
            space = Space(
                id=str(uuid.uuid4().hex),
                **space_data,
                created_at=datetime.utcnow()
            )
            db.add(space)
            created_spaces.append(space)
        
        db.commit()
        print(f"✅ Created {len(created_spaces)} spaces")
        
        # Create demo personal account (borrower)
        borrower = PersonalAccount(
            id=str(uuid.uuid4().hex),
            name="Alice",
            surname="Verdi",
            email="alice@example.com",
            password_hash=None,
            created_at=datetime.utcnow()
        )
        db.add(borrower)
        db.commit()
        print("✅ Created 1 personal account (borrower)")
        
        # Create demo bookings
        for i, space in enumerate(created_spaces[:3]):
            booking = Booking(
                booking_id=str(uuid.uuid4().hex),
                space_id=space.id,
                borrower_id=borrower.id,
                start_date=datetime.utcnow() + timedelta(days=7+i),
                end_date=datetime.utcnow() + timedelta(days=14+i),
                status="pending",
                created_at=datetime.utcnow()
            )
            db.add(booking)
        
        db.commit()
        print("✅ Created 3 demo bookings")
        
        print("\n" + "="*60)
        print("✅ Database seeding completed!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
