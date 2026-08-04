# #!/usr/bin/env python3
# """
# Seed script to populate categories and specializations tables with ALL data from IndustrialCategories.js.
# """

# import sys
# import os
# from datetime import datetime

# # Add project paths to sys.path
# PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# sys.path.insert(0, PROJECT_ROOT)

# from database.sqlite_db import get_connection, init_db

# def seed_all_categories():
#     """Seed the categories table with ALL 16 categories from IndustrialCategories.js."""
#     print("Seeding ALL categories table...")
    
#     # All 16 categories from IndustrialCategories.js
#     categories = [
#         {
#             "title": "Manufacturing & Production",
#             "description": "Supporting the production of goods through machine operation, assembly, packaging, and plant supervision across Kenya's manufacturing sector.",
#             "open_roles": 1250,
#             "icon": "Factory",
#             "style": "light"
#         },
#         {
#             "title": "Engineering",
#             "description": "Designing, developing, and maintaining industrial systems in manufacturing, construction, energy, and infrastructure projects.",
#             "open_roles": 980,
#             "icon": "Cog",
#             "style": "dark"
#         },
#         {
#             "title": "Maintenance & Technical Services",
#             "description": "Keeping industrial equipment, machinery, and production systems operating efficiently through preventive and corrective maintenance.",
#             "open_roles": 720,
#             "icon": "Wrench",
#             "style": "light"
#         },
#         {
#             "title": "Construction & Infrastructure",
#             "description": "Building and maintaining residential, commercial, and industrial infrastructure across Kenya.",
#             "open_roles": 1150,
#             "icon": "HardHat",
#             "style": "dark"
#         },
#         {
#             "title": "Logistics & Supply Chain",
#             "description": "Managing procurement, warehousing, inventory, transportation, and distribution of goods across industries.",
#             "open_roles": 860,
#             "icon": "Truck",
#             "style": "light"
#         },
#         {
#             "title": "Quality Assurance & Control",
#             "description": "Ensuring products and manufacturing processes comply with national and international quality standards.",
#             "open_roles": 430,
#             "icon": "BadgeCheck",
#             "style": "light"
#         },
#         {
#             "title": "Health, Safety & Environment",
#             "description": "Ensuring compliance and safety standards across construction, energy, and corporate sectors in accordance with DOSHS regulations.",
#             "open_roles": 410,
#             "icon": "ShieldCheck",
#             "style": "light"
#         },
#         {
#             "title": "Food & Beverage Processing",
#             "description": "Producing, processing, packaging, and ensuring quality in Kenya's food, dairy, and beverage manufacturing industries.",
#             "open_roles": 680,
#             "icon": "UtensilsCrossed",
#             "style": "dark"
#         },
#         {
#             "title": "Mining, Oil & Energy",
#             "description": "Supporting resource extraction, power generation, renewable energy, and petroleum operations across Kenya.",
#             "open_roles": 350,
#             "icon": "Fuel",
#             "style": "light"
#         },
#         {
#             "title": "Textile & Apparel",
#             "description": "Manufacturing garments, fabrics, and textile products for local and international markets.",
#             "open_roles": 540,
#             "icon": "Shirt",
#             "style": "dark"
#         },
#         {
#             "title": "Automotive",
#             "description": "Repairing, maintaining, assembling, and servicing motor vehicles and transport equipment.",
#             "open_roles": 490,
#             "icon": "Car",
#             "style": "light"
#         },
#         {
#             "title": "Chemical & Pharmaceutical",
#             "description": "Manufacturing chemicals, medicines, and laboratory products while ensuring compliance with quality standards.",
#             "open_roles": 280,
#             "icon": "FlaskConical",
#             "style": "dark"
#         },
#         {
#             "title": "Industrial Automation & ICT",
#             "description": "Developing automation systems, PLC programming, industrial networking, robotics, and smart manufacturing solutions.",
#             "open_roles": 320,
#             "icon": "Cpu",
#             "style": "light"
#         },
#         {
#             "title": "Administration & Support Services",
#             "description": "Providing administrative, financial, HR, and operational support for industrial organizations.",
#             "open_roles": 770,
#             "icon": "Briefcase",
#             "style": "dark"
#         },
#         {
#             "title": "Security & Facility Management",
#             "description": "Protecting industrial premises, managing facilities, and ensuring secure and efficient operations.",
#             "open_roles": 610,
#             "icon": "Building2",
#             "style": "light"
#         },
#         {
#             "title": "Agriculture & Agro-processing",
#             "description": "Processing agricultural products and supporting Kenya's tea, coffee, horticulture, and food production industries.",
#             "open_roles": 890,
#             "icon": "Wheat",
#             "style": "dark"
#         }
#     ]
    
#     conn = get_connection()
#     try:
#         cursor = conn.cursor()
        
#         # Clear existing data
#         cursor.execute("DELETE FROM categories")
        
#         # Insert ALL 16 categories
#         for category in categories:
#             cursor.execute(
#                 """
#                 INSERT INTO categories (title, description, open_roles, icon, style, created_at)
#                 VALUES (?, ?, ?, ?, ?, ?)
#                 """,
#                 (
#                     category["title"],
#                     category["description"],
#                     category["open_roles"],
#                     category["icon"],
#                     category["style"],
#                     datetime.utcnow().isoformat()
#                 )
#             )
        
#         conn.commit()
#         print(f"✓ Added ALL {len(categories)} categories from IndustrialCategories.js")
        
#     finally:
#         conn.close()

# def seed_all_specializations():
#     """Seed the specializations table with ALL 16 items as specializations."""
#     print("Seeding ALL specializations table...")
    
#     # All 16 items as specializations (converted from categories)
#     specializations = [
#         {
#             "title": "Manufacturing & Production",
#             "description": "Supporting the production of goods through machine operation, assembly, packaging, and plant supervision across Kenya's manufacturing sector.",
#             "positions": 1250,
#             "icon": "Factory",
#             "style": "light"
#         },
#         {
#             "title": "Engineering",
#             "description": "Designing, developing, and maintaining industrial systems in manufacturing, construction, energy, and infrastructure projects.",
#             "positions": 980,
#             "icon": "Cog",
#             "style": "dark"
#         },
#         {
#             "title": "Maintenance & Technical Services",
#             "description": "Keeping industrial equipment, machinery, and production systems operating efficiently through preventive and corrective maintenance.",
#             "positions": 720,
#             "icon": "Wrench",
#             "style": "light"
#         },
#         {
#             "title": "Construction & Infrastructure",
#             "description": "Building and maintaining residential, commercial, and industrial infrastructure across Kenya.",
#             "positions": 1150,
#             "icon": "HardHat",
#             "style": "dark"
#         },
#         {
#             "title": "Logistics & Supply Chain",
#             "description": "Managing procurement, warehousing, inventory, transportation, and distribution of goods across industries.",
#             "positions": 860,
#             "icon": "Truck",
#             "style": "light"
#         },
#         {
#             "title": "Quality Assurance & Control",
#             "description": "Ensuring products and manufacturing processes comply with national and international quality standards.",
#             "positions": 430,
#             "icon": "BadgeCheck",
#             "style": "light"
#         },
#         {
#             "title": "Health, Safety & Environment",
#             "description": "Ensuring compliance and safety standards across construction, energy, and corporate sectors in accordance with DOSHS regulations.",
#             "positions": 410,
#             "icon": "ShieldCheck",
#             "style": "light"
#         },
#         {
#             "title": "Food & Beverage Processing",
#             "description": "Producing, processing, packaging, and ensuring quality in Kenya's food, dairy, and beverage manufacturing industries.",
#             "positions": 680,
#             "icon": "UtensilsCrossed",
#             "style": "dark"
#         },
#         {
#             "title": "Mining, Oil & Energy",
#             "description": "Supporting resource extraction, power generation, renewable energy, and petroleum operations across Kenya.",
#             "positions": 350,
#             "icon": "Fuel",
#             "style": "light"
#         },
#         {
#             "title": "Textile & Apparel",
#             "description": "Manufacturing garments, fabrics, and textile products for local and international markets.",
#             "positions": 540,
#             "icon": "Shirt",
#             "style": "dark"
#         },
#         {
#             "title": "Automotive",
#             "description": "Repairing, maintaining, assembling, and servicing motor vehicles and transport equipment.",
#             "positions": 490,
#             "icon": "Car",
#             "style": "light"
#         },
#         {
#             "title": "Chemical & Pharmaceutical",
#             "description": "Manufacturing chemicals, medicines, and laboratory products while ensuring compliance with quality standards.",
#             "positions": 280,
#             "icon": "FlaskConical",
#             "style": "dark"
#         },
#         {
#             "title": "Industrial Automation & ICT",
#             "description": "Developing automation systems, PLC programming, industrial networking, robotics, and smart manufacturing solutions.",
#             "positions": 320,
#             "icon": "Cpu",
#             "style": "light"
#         },
#         {
#             "title": "Administration & Support Services",
#             "description": "Providing administrative, financial, HR, and operational support for industrial organizations.",
#             "positions": 770,
#             "icon": "Briefcase",
#             "style": "dark"
#         },
#         {
#             "title": "Security & Facility Management",
#             "description": "Protecting industrial premises, managing facilities, and ensuring secure and efficient operations.",
#             "positions": 610,
#             "icon": "Building2",
#             "style": "light"
#         },
#         {
#             "title": "Agriculture & Agro-processing",
#             "description": "Processing agricultural products and supporting Kenya's tea, coffee, horticulture, and food production industries.",
#             "positions": 890,
#             "icon": "Wheat",
#             "style": "dark"
#         }
#     ]
    
#     conn = get_connection()
#     try:
#         cursor = conn.cursor()
        
#         # Clear existing data
#         cursor.execute("DELETE FROM specializations")
        
#         # Insert ALL 16 specializations
#         for spec in specializations:
#             cursor.execute(
#                 """
#                 INSERT INTO specializations (title, description, positions, icon, style, created_at)
#                 VALUES (?, ?, ?, ?, ?, ?)
#                 """,
#                 (
#                     spec["title"],
#                     spec["description"],
#                     spec["positions"],
#                     spec["icon"],
#                     spec["style"],
#                     datetime.utcnow().isoformat()
#                 )
#             )
        
#         conn.commit()
#         print(f"✓ Added ALL {len(specializations)} specializations")
        
#     finally:
#         conn.close()

# def main():
#     """Main seeding function."""
#     print("Initializing database...")
#     init_db()
    
#     seed_all_categories()
#     seed_all_specializations()
    
#     print("\n✅ Seeding completed successfully with ALL data!")
    
#     # Show what was added
#     conn = get_connection()
#     try:
#         cursor = conn.cursor()
        
#         cursor.execute("SELECT COUNT(*) as count FROM categories")
#         cat_count = cursor.fetchone()[0]
        
#         cursor.execute("SELECT COUNT(*) as count FROM specializations")
#         spec_count = cursor.fetchone()[0]
        
#         print(f"\nDatabase now contains:")
#         print(f"  - {cat_count} categories")
#         print(f"  - {spec_count} specializations")
#         print(f"\nAll {cat_count + spec_count} items from IndustrialCategories.js have been loaded!")
        
#     finally:
#         conn.close()

# if __name__ == "__main__":
#     main()