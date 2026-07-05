"""Unit tests for spaces service functions."""

from types import SimpleNamespace

from services.spaces import create_space


def make_space_data(**overrides):
    defaults = {
        "name": "Test Loft",
        "location": "Via Example, Milano",
        "area_m2": 100.0,
        "category": "Loft",
        "is_outdoor": False,
        "availability": "Weekends",
        "description": "A bright loft",
        "rules": "No smoking",
    }
    defaults.update(overrides)
    return SimpleNamespace(**defaults)


class TestCreateSpace:
    def test_create_space_success(self, db):
        data = make_space_data()
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert error is None
        assert space is not None
        assert space.name == "Test Loft"
        assert space.location == "Via Example, Milano"
        assert space.area_m2 == 100.0
        assert space.category == "Loft"
        assert space.owner_id == "owner-abc"
        assert space.is_outdoor is False
        assert space.availability == "Weekends"
        assert space.description == "A bright loft"
        assert space.rules == "No smoking"
        assert space.id

    def test_create_space_strips_whitespace(self, db):
        data = make_space_data(
            name="  Spaced Name  ",
            location="  Milano  ",
            category="  Studio  ",
        )
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert error is None
        assert space.name == "Spaced Name"
        assert space.location == "Milano"
        assert space.category == "Studio"

    def test_create_space_missing_name(self, db):
        data = make_space_data(name="   ")
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert space is None
        assert error == "Name is required"

    def test_create_space_missing_location(self, db):
        data = make_space_data(location="")
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert space is None
        assert error == "Location is required"

    def test_create_space_invalid_area(self, db):
        data = make_space_data(area_m2=0)
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert space is None
        assert error == "Area must be greater than 0"

    def test_create_space_missing_category(self, db):
        data = make_space_data(category="  ")
        space, error = create_space(owner_id="owner-abc", data=data, db=db)

        assert space is None
        assert error == "Category is required"
