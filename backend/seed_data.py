#!/usr/bin/env python3
# Seed Database with Demo Data
# Usage: python3 seed_data.py

import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from database import SessionLocal
from models import Space, Booking, PersonalAccount, User, AccountType, Rating, SpacePhoto
from services.auth import hash_password
from services.bookings import _generate_contract_text

SEED_DIR = Path(__file__).resolve().parent
SEED_ASSETS_DIR = SEED_DIR / "seed_assets" / "spaces"
UPLOAD_DIR = SEED_DIR / "uploads"

SPACE_PHOTO_MAP = {
    "Bright Loft - Centro": "alpine-loft.png",
    "Panoramic Terrace - Walther": "walther-terrace.png",
    "Meeting Room - Portici": "conference-room.png",
    "Alpine Loft - Centro": "alpine-loft.png",
    "Walther Terrace": "walther-terrace.png",
    "Makers Studio - Oltrisarco": "makers-studio.png",
    "Community Garden - Europa": "community-garden.png",
    "Creative Studio - Gries": "creative-studio.png",
    "Shared Garden - Don Bosco": "shared-garden.png",
    "Meeting Room - Central": "conference-room.png",
    "Community Kitchen - Centro": "culinary-experience.png",
}


def _photo_asset_for_space(space: Space) -> str | None:
    return SPACE_PHOTO_MAP.get(space.name)


def _attach_seed_photo(space: Space, db) -> None:
    asset_name = _photo_asset_for_space(space)
    if not asset_name:
        return
    asset_path = SEED_ASSETS_DIR / asset_name
    if not asset_path.is_file():
        return

    UPLOAD_DIR.mkdir(exist_ok=True)
    filename = f"{uuid.uuid4().hex}{asset_path.suffix}"
    shutil.copy2(asset_path, UPLOAD_DIR / filename)

    db.add(SpacePhoto(
        photo_id=uuid.uuid4().hex,
        space_id=space.id,
        image_url=f"/uploads/{filename}",
        position=0,
        created_at=datetime.utcnow(),
    ))


def _clear_uploads() -> None:
    if not UPLOAD_DIR.exists():
        return
    for path in UPLOAD_DIR.iterdir():
        if path.is_file():
            path.unlink()


def seed_database():
    """Populate database with demo data"""
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(Rating).delete()
        db.query(Booking).delete()
        db.query(SpacePhoto).delete()
        db.query(Space).delete()
        db.query(PersonalAccount).delete()
        db.commit()
        _clear_uploads()
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
        
        # owner1 (demoowner): 3 spaces — My spaces / Host
        # owner2: 8 Bolzano spaces — visible in Find for demoowner
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
                "rules": "No smoking. Respect checkout time. Final cleanup is the organizer's responsibility.",
                "exchange_preferences": "Help with event setup or social media coverage."
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
                "rules": "Maximum 25 guests. Music until 10:00 PM. No fireworks.",
                "exchange_preferences": "Photography or catering help in exchange for weekend use."
            },
            {
                "name": "Meeting Room - Portici",
                "owner_id": owner1_id,
                "area_m2": 60.0,
                "is_outdoor": False,
                "category": "Conference",
                "availability": "Hourly",
                "max_people": 15,
                "location": "Via dei Portici, Bolzano",
                "description": "Central meeting room with Wi-Fi, projector, and whiteboard. For meetings, training, and small professional events.",
                "rules": "Free cancellation up to 24 hours before. Return the room in its original condition.",
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
            {
                "name": "Meeting Room - Central",
                "owner_id": owner2_id,
                "area_m2": 60.0,
                "is_outdoor": False,
                "category": "Conference",
                "availability": "Hourly",
                "max_people": 15,
                "location": "Via dei Portici, Bolzano",
                "description": "Central meeting room with Wi-Fi, projector, and whiteboard. For meetings, training, and small professional events.",
                "rules": "Free cancellation up to 24 hours before. Return the room in its original condition.",
                "exchange_preferences": "Help with room setup or note-taking for longer bookings."
            },
            {
                "name": "Community Kitchen - Centro",
                "owner_id": owner2_id,
                "area_m2": 80.0,
                "is_outdoor": False,
                "category": "Culinary experience",
                "availability": "Weekdays 10-18",
                "max_people": 20,
                "location": "Via Laurin, Bolzano",
                "description": "Shared commercial kitchen for cooking workshops, pop-up dining, and food skills sessions. Fully equipped with ovens, prep stations, and cold storage.",
                "rules": "Follow food safety guidelines. Clean all surfaces after use. No deep frying without prior agreement.",
                "exchange_preferences": "Teaching a cooking class or helping with kitchen cleanup."
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
        print(f"✅ Created {len(created_spaces)} spaces (3 demoowner, 8 Find listings)")

        for space in created_spaces:
            _attach_seed_photo(space, db)
        db.commit()
        print(f"✅ Created photos for {len(created_spaces)} spaces")
        
        # Create demo personal accounts (borrowers)
        borrower = PersonalAccount(
            id=str(uuid.uuid4().hex),
            name="Lena",
            surname="Fischer",
            email="lena@example.com",
            password_hash=None,
            created_at=datetime.utcnow()
        )
        borrower2 = PersonalAccount(
            id=str(uuid.uuid4().hex),
            name="Tom",
            surname="Bauer",
            email="tom@example.com",
            password_hash=None,
            created_at=datetime.utcnow()
        )
        borrower3 = PersonalAccount(
            id=str(uuid.uuid4().hex),
            name="Sara",
            surname="Conti",
            email="sara@example.com",
            password_hash=None,
            created_at=datetime.utcnow()
        )
        db.add(borrower)
        db.add(borrower2)
        db.add(borrower3)
        db.commit()
        print("✅ Created 3 personal accounts (borrowers)")

        # Demo bookings on demoowner spaces (2 pending + 1 approved)
        owner1_spaces = [space for space in created_spaces if space.owner_id == owner1_id]
        demoowner_booking_specs = [
            (
                borrower,
                "pending",
                "I am a visual artist working with large-scale textile installations. I would love to use your loft for a two-week residency and open studio.",
            ),
            (
                borrower2,
                "pending",
                "Weekend acoustic sessions and a small listening event in exchange for helping refresh the terrace planters.",
            ),
            (
                borrower3,
                "approved",
                "Professional photo coverage and social media promotion for your space in exchange for weekend access.",
            ),
        ]
        for i, space in enumerate(owner1_spaces[:3]):
            guest, status, offer = demoowner_booking_specs[i]
            booking = Booking(
                booking_id=str(uuid.uuid4().hex),
                space_id=space.id,
                borrower_id=guest.id,
                start_date=datetime.utcnow() + timedelta(days=7 + i * 7),
                end_date=datetime.utcnow() + timedelta(days=14 + i * 7),
                status=status,
                exchange_offer=offer,
                intended_use="Creative residency and community workshop",
                created_at=datetime.utcnow(),
            )
            if status == "approved":
                booking.contract_text = _generate_contract_text(space, booking)
            db.add(booking)
        db.commit()
        print("✅ Created 3 demo bookings on demoowner listings (2 pending, 1 approved)")

        # Past approved bookings + borrower ratings on owner2 spaces (visible in Find)
        owner2_spaces = {s.name: s for s in created_spaces if s.owner_id == owner2_id}
        rating_specs = [
            # (space_name, borrower, ratings list of (score, comment))
            ("Alpine Loft - Centro", borrower, [(5, "Beautiful light and very welcoming host."), (4, "Great workshop space.")]),
            ("Walther Terrace", borrower2, [(5, "Perfect summer evening spot.")]),
            ("Makers Studio - Oltrisarco", borrower, [(4, "Well equipped studio.")]),
            ("Community Garden - Europa", borrower3, [(3, "Lovely garden, a bit muddy after rain."), (5, "Amazing community vibe.")]),
            ("Creative Studio - Gries", borrower2, [(4, "Good acoustics for rehearsals.")]),
        ]

        rating_count = 0
        for space_name, guest, ratings in rating_specs:
            space = owner2_spaces.get(space_name)
            if not space:
                continue
            for i, (score, comment) in enumerate(ratings):
                start = datetime.utcnow() - timedelta(days=30 + i * 14)
                end = datetime.utcnow() - timedelta(days=20 + i * 14)
                booking = Booking(
                    booking_id=str(uuid.uuid4().hex),
                    space_id=space.id,
                    borrower_id=guest.id,
                    start_date=start,
                    end_date=end,
                    status="approved",
                    exchange_offer="Community workshop and skill-sharing session.",
                    intended_use="Community event",
                    created_at=start,
                )
                booking.contract_text = _generate_contract_text(space, booking)
                db.add(booking)
                db.flush()
                db.add(Rating(
                    id=str(uuid.uuid4().hex),
                    booking_id=booking.booking_id,
                    rater_user_id=guest.id,
                    rating=score,
                    comment=comment,
                    created_at=end + timedelta(days=1),
                ))
                rating_count += 1

        db.commit()
        print(f"✅ Created past bookings with {rating_count} visit ratings on Find listings")
        
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
