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
            name="Mark",
            surname="Rossi",
            company="Sustainable Spaces",
            company_email="mark@sustainablespaces.com",
            created_at=datetime.utcnow()
        )
        owner2 = BusinessAccount(
            id=owner2_id,
            name="Lucy",
            surname="White",
            company="Community Hub Milan",
            company_email="lucy@communityhub.com",
            created_at=datetime.utcnow()
        )
        db.add(owner1)
        db.add(owner2)
        db.commit()
        print("✅ Created 2 business accounts")
        
        # Create demo spaces
        spaces_data = [
            {
                "name": "Bright Loft - Navigli",
                "owner_id": owner1_id,
                "area_m2": 120.0,
                "is_outdoor": False,
                "category": "Loft",
                "availability": "Weekends",
                "deposit_needed": 500.0,
                "location": "Naviglio Grande, Milan",
                "description": "Spacious open-plan loft with large windows overlooking the Navigli canals. Ideal for workshops, exhibitions, and community gatherings.",
                "rules": "No smoking. Respect checkout time. Final cleanup is the organizer's responsibility."
            },
            {
                "name": "Panoramic Terrace - Duomo",
                "owner_id": owner1_id,
                "area_m2": 80.0,
                "is_outdoor": True,
                "category": "Terrace",
                "availability": "Flexible",
                "deposit_needed": 300.0,
                "location": "Piazza Duomo, Milan",
                "description": "Rooftop terrace with views of the Duomo, perfect for outdoor events, drinks, and small performances.",
                "rules": "Maximum 40 guests. Music until 10:00 PM. No fireworks."
            },
            {
                "name": "Creative Studio - Lambrate",
                "owner_id": owner2_id,
                "area_m2": 150.0,
                "is_outdoor": False,
                "category": "Studio",
                "availability": "Weekdays 9-18",
                "deposit_needed": 400.0,
                "location": "Via Lambrertesca, Milan",
                "description": "Creative studio with natural light, work tables, and a lounge area. Suited for classes, artist residencies, and coworking.",
                "rules": "Shared equipment must be restored after use. Minimum booking of 4 hours."
            },
            {
                "name": "Shared Garden - Porta Romana",
                "owner_id": owner2_id,
                "area_m2": 200.0,
                "is_outdoor": True,
                "category": "Garden",
                "availability": "Daily",
                "deposit_needed": 200.0,
                "location": "Porta Romana, Milan",
                "description": "Urban garden with a community allotment, picnic area, and space for outdoor workshops.",
                "rules": "Respect the allotment plants. Bring bags for waste. Pets on leash only."
            },
            {
                "name": "Meeting Room - Central",
                "owner_id": owner1_id,
                "area_m2": 60.0,
                "is_outdoor": False,
                "category": "Office",
                "availability": "Hourly",
                "deposit_needed": 150.0,
                "location": "Via Torino, Milan",
                "description": "Central meeting room with Wi-Fi, projector, and whiteboard. For meetings, training, and small professional events.",
                "rules": "Free cancellation up to 24 hours before. Return the room in its original condition."
            },
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
            surname="Green",
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
