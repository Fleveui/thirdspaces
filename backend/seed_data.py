#!/usr/bin/env python3
# Seed Database with Demo Data
# Usage: python3 seed_data.py

from datetime import datetime, timedelta
from database import SessionLocal
from models import Space, Booking, PersonalAccount, User, AccountType
from services.auth import hash_password
from services.bookings import _generate_contract_text
import uuid

def seed_database():
    """Populate database with demo data"""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Booking).delete()
        db.query(Space).delete()
        db.query(PersonalAccount).delete()
        db.commit()
        print("✅ Cleared existing data")
        
        # Create demo space owner profiles
        owner1_id = str(uuid.uuid4().hex)
        owner2_id = str(uuid.uuid4().hex)
        
        owner1 = PersonalAccount(
            id=owner1_id,
            name="Mark",
            surname="Rossi",
            email="mark@sustainablespaces.com",
            created_at=datetime.utcnow()
        )
        owner2 = PersonalAccount(
            id=owner2_id,
            name="Lucy",
            surname="White",
            email="lucy@communityhub.com",
            created_at=datetime.utcnow()
        )
        db.add(owner1)
        db.add(owner2)
        db.commit()
        print("✅ Created 2 owner profiles")

        existing_demo_user = db.query(User).filter(User.username == "demoowner").first()
        if existing_demo_user:
            db.delete(existing_demo_user)
            db.commit()

        demo_user = User(
            id=owner1_id,
            username="demoowner",
            email="demoowner@example.com",
            password_hash=hash_password("secret12"),
            account_type=AccountType.SPACE_OWNER,
            created_at=datetime.utcnow(),
        )
        db.add(demo_user)
        db.commit()
        print("✅ Created demo space owner login (demoowner / secret12)")
        
        # owner1 (demoowner): 3 spaces — visible only in My spaces
        # owner2: 6 spaces — visible only in Find for demoowner
        spaces_data = [
            {
                "name": "Bright Loft - Centro",
                "owner_id": owner1_id,
                "area_m2": 120.0,
                "is_outdoor": False,
                "category": "Workshop",
                "availability": "Weekends",
                "max_people": 35,
                "location": "Via Laurin, Bolzano",
                "description": "Spacious open-plan loft in Bolzano city centre with mountain views. Ideal for workshops, exhibitions, and community gatherings.",
                "rules": "No smoking. Respect checkout time. Final cleanup is the organizer's responsibility."
            },
            {
                "name": "Panoramic Terrace - Walther",
                "owner_id": owner1_id,
                "area_m2": 80.0,
                "is_outdoor": True,
                "category": "Exhibition",
                "availability": "Flexible",
                "max_people": 25,
                "location": "Piazza Walther, Bolzano",
                "description": "Rooftop terrace with views of the Dolomites, perfect for outdoor events, drinks, and small performances.",
                "rules": "Maximum 25 guests. Music until 10:00 PM. No fireworks."
            },
            {
                "name": "Meeting Room - Central",
                "owner_id": owner1_id,
                "area_m2": 60.0,
                "is_outdoor": False,
                "category": "Conference",
                "availability": "Hourly",
                "max_people": 15,
                "location": "Via dei Portici, Bolzano",
                "description": "Central meeting room with Wi-Fi, projector, and whiteboard. For meetings, training, and small professional events.",
                "rules": "Free cancellation up to 24 hours before. Return the room in its original condition."
            },
            {
                "name": "Alpine Loft - Centro",
                "owner_id": owner2_id,
                "area_m2": 95.0,
                "is_outdoor": False,
                "category": "Workshop",
                "availability": "Weekends",
                "max_people": 30,
                "location": "Via Laurin, Bolzano",
                "description": "Bright loft in Bolzano city centre with mountain views. Ideal for workshops, pop-up exhibitions, and small community events.",
                "rules": "No loud music after 9 PM. Leave the space tidy after use.",
                "exchange_preferences": "Help with social media promotion or event setup support."
            },
            {
                "name": "Walther Terrace",
                "owner_id": owner2_id,
                "area_m2": 70.0,
                "is_outdoor": True,
                "category": "Exhibition",
                "availability": "Flexible",
                "max_people": 25,
                "location": "Piazza Walther, Bolzano",
                "description": "Sunny terrace steps from Piazza Walther. Perfect for outdoor meetups, aperitivos, and summer gatherings.",
                "rules": "Maximum 25 guests. Respect neighbours. No glass bottles on the railing.",
                "exchange_preferences": "Catering help or photography in exchange for weekend use."
            },
            {
                "name": "Makers Studio - Oltrisarco",
                "owner_id": owner2_id,
                "area_m2": 110.0,
                "is_outdoor": False,
                "category": "Crafting",
                "availability": "Weekdays 10-18",
                "max_people": 20,
                "location": "Via Rafenstein, Bolzano",
                "description": "Creative studio in Oltrisarco with workbenches, natural light, and a small kitchen. Suited for craft workshops and coworking.",
                "rules": "Clean tools after use. Book at least 3 hours. No hazardous materials.",
                "exchange_preferences": "Teaching a skill-sharing session for the neighbourhood."
            },
            {
                "name": "Community Garden - Europa",
                "owner_id": owner2_id,
                "area_m2": 180.0,
                "is_outdoor": True,
                "category": "Physical activity",
                "availability": "Daily",
                "max_people": 40,
                "location": "Via Europa, Bolzano",
                "description": "Shared garden plot with picnic tables and a toolshed. Great for gardening workshops, outdoor classes, and community dinners.",
                "rules": "Compost organic waste on site. Do not disturb planted beds. Dogs on leash.",
                "exchange_preferences": "Garden maintenance or composting help welcomed."
            },
            {
                "name": "Creative Studio - Gries",
                "owner_id": owner2_id,
                "area_m2": 150.0,
                "is_outdoor": False,
                "category": "Music",
                "availability": "Weekdays 9-18",
                "max_people": 25,
                "location": "Via Gries, Bolzano",
                "description": "Creative studio with natural light, work tables, and a lounge area. Suited for music rehearsals, classes, and artist residencies.",
                "rules": "Shared equipment must be restored after use. Minimum booking of 4 hours."
            },
            {
                "name": "Shared Garden - Don Bosco",
                "owner_id": owner2_id,
                "area_m2": 200.0,
                "is_outdoor": True,
                "category": "Physical activity",
                "availability": "Daily",
                "max_people": 50,
                "location": "Via Don Bosco, Bolzano",
                "description": "Urban garden with a community allotment, picnic area, and space for outdoor workshops.",
                "rules": "Respect the allotment plants. Bring bags for waste. Pets on leash only."
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
        print(f"✅ Created {len(created_spaces)} spaces (3 demoowner, 6 other owner)")
        
        # Create demo personal account (borrower)
        borrower = PersonalAccount(
            id=str(uuid.uuid4().hex),
            name="Lena",
            surname="Fischer",
            email="lena@example.com",
            password_hash=None,
            created_at=datetime.utcnow()
        )
        db.add(borrower)
        db.commit()
        print("✅ Created 1 personal account (borrower)")
        
        # Create demo bookings on owner1 spaces with mixed statuses
        owner1_spaces = [space for space in created_spaces if space.owner_id == owner1_id]
        booking_statuses = ["pending", "approved", "rejected"]
        exchange_offers = [
            "I am a visual artist working with large-scale textile installations. I would love to use your loft for a two-week residency and open studio.",
            "Professional photo coverage and social media promotion for your space in exchange for weekend access.",
            "Weekly garden maintenance and composting support for three months.",
        ]

        for i, space in enumerate(owner1_spaces[:3]):
            booking = Booking(
                booking_id=str(uuid.uuid4().hex),
                space_id=space.id,
                borrower_id=borrower.id,
                start_date=datetime.utcnow() + timedelta(days=7 + i * 7),
                end_date=datetime.utcnow() + timedelta(days=14 + i * 7),
                status=booking_statuses[i],
                exchange_offer=exchange_offers[i],
                intended_use="Creative residency and community workshop",
                created_at=datetime.utcnow(),
            )
            if booking_statuses[i] == "approved":
                booking.contract_text = _generate_contract_text(space, booking)
            db.add(booking)

        db.commit()
        print("✅ Created 3 demo bookings (pending, approved, rejected)")
        
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
