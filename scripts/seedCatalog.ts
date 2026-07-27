import { loadEnvConfig } from "@next/env";
import mongoose from "mongoose";

loadEnvConfig(process.cwd());

type ServiceSeed = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  price: number;
  durationMinutes: number;
  features: string[];
};

type AddonSeed = {
  key: string;
  name: string;
  description: string;
  price: number;
  extraDurationMinutes: number;
  maxQuantity: number;
};

const services: ServiceSeed[] = [
  {
    name: "Regular Home Cleaning",
    slug: "regular-home-cleaning",
    shortDescription: "Reliable routine care that keeps your home consistently fresh.",
    description:
      "A balanced recurring clean for apartments and houses. Our team works through the everyday areas that collect dust, fingerprints, crumbs, and bathroom buildup so your home feels reset without the intensity of a full deep clean.",
    category: "Home Cleaning",
    price: 35,
    durationMinutes: 120,
    features: [
      "Dusting furniture and accessible surfaces",
      "Vacuuming, sweeping, and mopping floors",
      "Kitchen counters, sink, and appliance exteriors",
      "Bathroom fixtures, mirrors, and floors",
      "Bed making and general room reset",
      "Trash removal and final quality check",
    ],
  },
  {
    name: "Deep Cleaning",
    slug: "deep-cleaning",
    shortDescription: "A detailed top-to-bottom clean for spaces needing extra attention.",
    description:
      "Deep Cleaning reaches the buildup routine visits can miss. It is ideal for seasonal resets, first-time professional cleaning, or homes that need more focused work across kitchens, bathrooms, living areas, edges, fixtures, and difficult-to-reach surfaces.",
    category: "Home Cleaning",
    price: 65,
    durationMinutes: 240,
    features: [
      "Detailed kitchen and bathroom cleaning",
      "Baseboards, trim, doors, and reachable frames",
      "Hard-to-reach dust and surface buildup removal",
      "Furniture, shelving, and fixture detailing",
      "Floor scrubbing, vacuuming, and mopping",
      "Room-by-room final quality inspection",
    ],
  },
  {
    name: "Move-In / Move-Out Cleaning",
    slug: "move-in-move-out-cleaning",
    shortDescription: "Complete empty-property cleaning before handing over the keys.",
    description:
      "Designed for vacant homes and apartments during a move. We prepare rooms, cabinets, kitchens, bathrooms, floors, and interior surfaces for a cleaner handover, a new tenant, or your first day in a new home.",
    category: "Home Cleaning",
    price: 85,
    durationMinutes: 300,
    features: [
      "Empty-property room cleaning",
      "Inside accessible cabinets and closets",
      "Detailed kitchen and bathroom cleaning",
      "Complete floor and edge cleaning",
      "Doors, frames, switches, and handles",
      "Final handover-ready inspection",
    ],
  },
  {
    name: "Office Cleaning",
    slug: "office-cleaning",
    shortDescription: "Professional cleaning for productive offices and shared workspaces.",
    description:
      "A dependable workplace service for offices, studios, and professional suites. We clean desks, shared areas, kitchens, washrooms, reception spaces, and floors while respecting organized workstations and business operations.",
    category: "Commercial Cleaning",
    price: 75,
    durationMinutes: 240,
    features: [
      "Desk and accessible workstation surfaces",
      "Reception and shared workspace cleaning",
      "Office kitchen and washroom cleaning",
      "Floor vacuuming and mopping",
      "Trash collection and liner replacement",
      "High-touch point disinfection",
    ],
  },
  {
    name: "Sofa and Upholstery Cleaning",
    slug: "sofa-upholstery-cleaning",
    shortDescription: "Focused fabric care for sofas, chairs, and upholstered furniture.",
    description:
      "Refresh upholstered furniture with careful vacuuming and surface treatment. This service targets dust, crumbs, pet hair, and everyday surface soil while giving cushions, seams, and accessible fabric areas focused attention.",
    category: "Specialized Cleaning",
    price: 45,
    durationMinutes: 120,
    features: [
      "Sofa and chair surface vacuuming",
      "Cushion, seam, and crevice cleaning",
      "Dust, crumbs, and pet-hair removal",
      "Fabric-appropriate surface treatment",
      "Spot attention for suitable marks",
      "Final furniture grooming and inspection",
    ],
  },
  {
    name: "Post-Construction Cleaning",
    slug: "post-construction-cleaning",
    shortDescription: "Intensive cleanup after construction, repairs, or renovation.",
    description:
      "A detailed multi-pass cleanup for newly built or renovated spaces. We remove fine construction dust, light debris, labels, marks, and surface residue so the property is safer, clearer, and ready for furnishing or handover.",
    category: "Specialized Cleaning",
    price: 110,
    durationMinutes: 360,
    features: [
      "Multi-pass fine construction dust removal",
      "Floors, walls, ledges, and surface cleaning",
      "Window glass, tracks, and frame detailing",
      "Kitchen and bathroom post-work cleanup",
      "Light debris collection and bagging",
      "Final readiness inspection",
    ],
  },
  {
    name: "Airbnb Turnover Cleaning",
    slug: "airbnb-turnover-cleaning",
    shortDescription: "Fast, guest-ready turnover care between short-stay bookings.",
    description:
      "A structured turnover service for hosts and property managers. We reset bedrooms, bathrooms, kitchens, living areas, linens, and presentation details so the property is clean, organized, and ready for the next arrival.",
    category: "Hospitality Cleaning",
    price: 55,
    durationMinutes: 180,
    features: [
      "Guest-ready bedroom and bathroom reset",
      "Kitchen surfaces and used-dish check",
      "Fresh linen placement when supplied",
      "Living-area cleaning and presentation",
      "Trash removal and supply-level check",
      "Photo-ready final walkthrough",
    ],
  },
  {
    name: "Villa Cleaning",
    slug: "villa-cleaning",
    shortDescription: "Coordinated cleaning for large homes, villas, and multi-level spaces.",
    description:
      "A larger-team cleaning plan for spacious residences. The route covers living areas, bedrooms, bathrooms, kitchens, staircases, entrances, and multiple floor levels with time scaled to the property profile.",
    category: "Home Cleaning",
    price: 120,
    durationMinutes: 360,
    features: [
      "Multi-room and multi-level cleaning route",
      "Bedrooms, living rooms, and reception areas",
      "Kitchen and bathroom cleaning",
      "Stairs, landings, and main entrances",
      "Floor care across large surface areas",
      "Coordinated final inspection",
    ],
  },
  {
    name: "Kitchen Intensive Cleaning",
    slug: "kitchen-intensive-cleaning",
    shortDescription: "Focused grease and buildup removal across the heart of your home.",
    description:
      "A kitchen-only intensive service targeting cooking residue, grease, cabinet fronts, counters, sinks, backsplash areas, appliance exteriors, and floor edges. Interior appliances can be added as extra touches.",
    category: "Room-Specific Cleaning",
    price: 48,
    durationMinutes: 150,
    features: [
      "Counters, sink, taps, and backsplash",
      "Cabinet fronts, handles, and kickboards",
      "Cooktop and appliance exteriors",
      "Grease-prone accessible surfaces",
      "Floor edges, vacuuming, and mopping",
      "Final kitchen sanitation check",
    ],
  },
  {
    name: "Bathroom Sanitizing",
    slug: "bathroom-sanitizing",
    shortDescription: "Detailed sanitation for bathrooms, showers, and wash areas.",
    description:
      "A focused bathroom service for fixtures, toilets, showers, tubs, mirrors, vanities, tiles, and floors. It combines visible-detail cleaning with careful attention to high-touch and moisture-prone areas.",
    category: "Room-Specific Cleaning",
    price: 38,
    durationMinutes: 120,
    features: [
      "Toilet, basin, shower, and tub cleaning",
      "Mirror, vanity, and fixture detailing",
      "Tile and accessible grout cleaning",
      "Limescale attention on suitable surfaces",
      "High-touch point sanitation",
      "Floor cleaning and final inspection",
    ],
  },
  {
    name: "Window and Glass Cleaning",
    slug: "window-glass-cleaning",
    shortDescription: "Clear, streak-conscious care for accessible windows and glass.",
    description:
      "Improve light and clarity with interior and safely accessible exterior glass cleaning. Frames, sills, tracks, mirrors, partitions, and glass doors can be included according to access and the selected extras.",
    category: "Specialized Cleaning",
    price: 50,
    durationMinutes: 150,
    features: [
      "Interior accessible window glass",
      "Safely accessible exterior panes",
      "Frames, sills, and basic track wipe",
      "Glass doors and interior partitions",
      "Mirror and reflective-surface cleaning",
      "Streak-conscious final check",
    ],
  },
  {
    name: "Carpet and Rug Cleaning",
    slug: "carpet-rug-cleaning",
    shortDescription: "Targeted care for fitted carpets, area rugs, and floor textiles.",
    description:
      "A fabric-floor service that removes loose soil, dust, crumbs, and suitable surface marks from carpets and rugs. The cleaning route is adjusted to material, size, condition, and safe treatment requirements.",
    category: "Specialized Cleaning",
    price: 55,
    durationMinutes: 150,
    features: [
      "Thorough carpet and rug vacuuming",
      "Edges and accessible area detailing",
      "Surface treatment appropriate to material",
      "Focused attention to suitable spots",
      "Odor-refresh treatment where appropriate",
      "Final pile grooming and inspection",
    ],
  },
  {
    name: "Mattress Refresh Cleaning",
    slug: "mattress-refresh-cleaning",
    shortDescription: "A focused refresh for mattresses, bed bases, and sleep surfaces.",
    description:
      "Refresh sleep surfaces with detailed vacuuming, seam and edge attention, dust removal, and suitable surface treatment. Multiple mattresses, headboards, and bed bases can be added by quantity.",
    category: "Specialized Cleaning",
    price: 40,
    durationMinutes: 90,
    features: [
      "Mattress surface vacuuming",
      "Seam, edge, and tuft detailing",
      "Dust and loose-debris removal",
      "Suitable surface spot attention",
      "Bed-base accessible surface cleaning",
      "Final sleep-area reset",
    ],
  },
  {
    name: "After-Event Cleanup",
    slug: "after-event-cleanup",
    shortDescription: "Restore your home or venue after celebrations and gatherings.",
    description:
      "A practical post-event route for living areas, dining spaces, kitchens, washrooms, floors, tables, and waste collection. Add dishwashing, furniture reset, balcony care, or extra waste handling as needed.",
    category: "Event Cleaning",
    price: 80,
    durationMinutes: 240,
    features: [
      "Event-area surface and table cleaning",
      "Floor vacuuming, sweeping, and mopping",
      "Kitchen and washroom reset",
      "Trash collection and basic sorting",
      "Furniture arrangement reset",
      "Final venue walkthrough",
    ],
  },
  {
    name: "Retail Store Cleaning",
    slug: "retail-store-cleaning",
    shortDescription: "Customer-ready cleaning for shops, showrooms, and boutiques.",
    description:
      "A commercial cleaning route focused on presentation and high-traffic areas. We cover sales floors, counters, fitting rooms, display exteriors, entrances, staff areas, washrooms, and accessible glass.",
    category: "Commercial Cleaning",
    price: 70,
    durationMinutes: 210,
    features: [
      "Sales-floor and counter cleaning",
      "Entrance and fitting-room reset",
      "Display exterior dusting",
      "Staff-area and washroom cleaning",
      "High-traffic floor care",
      "Opening-ready final inspection",
    ],
  },
  {
    name: "Clinic and Wellness Sanitizing",
    slug: "clinic-wellness-sanitizing",
    shortDescription: "Structured cleaning for clinics, studios, and wellness spaces.",
    description:
      "A careful cleaning route for reception areas, consultation rooms, treatment-room surfaces, washrooms, floors, and frequently touched points. This is an environmental cleaning service and does not replace regulated medical sterilization.",
    category: "Commercial Cleaning",
    price: 95,
    durationMinutes: 240,
    features: [
      "Reception and waiting-area cleaning",
      "Accessible treatment-room surfaces",
      "High-touch point disinfection",
      "Washroom and handwashing-area care",
      "Floor cleaning across client areas",
      "Documented final quality check",
    ],
  },
  {
    name: "School and Daycare Cleaning",
    slug: "school-daycare-cleaning",
    shortDescription: "Detailed care for classrooms, play spaces, and shared facilities.",
    description:
      "A structured route for classrooms, play areas, desks, tables, staff spaces, washrooms, corridors, and child-height touchpoints. Scheduling can be arranged outside active teaching and care hours.",
    category: "Commercial Cleaning",
    price: 105,
    durationMinutes: 300,
    features: [
      "Classroom and activity-area cleaning",
      "Desk, table, and chair surfaces",
      "Play-area accessible surfaces",
      "Washrooms and shared sinks",
      "Corridors and high-traffic floors",
      "High-touch point sanitation",
    ],
  },
  {
    name: "Eco-Friendly Home Cleaning",
    slug: "eco-friendly-home-cleaning",
    shortDescription: "A thoughtful home clean using lower-impact product choices.",
    description:
      "A complete home-cleaning route using selected lower-odor and lower-impact products where suitable. It is ideal for customers who prefer a gentler product profile while maintaining clear professional standards.",
    category: "Home Cleaning",
    price: 45,
    durationMinutes: 150,
    features: [
      "Lower-impact product selection",
      "Dusting and complete floor care",
      "Kitchen and bathroom surface cleaning",
      "Bedroom and living-area reset",
      "Responsible product use and ventilation",
      "Final room-by-room quality check",
    ],
  },
];

const addons: AddonSeed[] = [
  {
    key: "inside-fridge",
    name: "Inside Refrigerator",
    description:
      "Clean removable shelves, drawers, walls, and accessible interior refrigerator surfaces.",
    price: 15,
    extraDurationMinutes: 30,
    maxQuantity: 2,
  },
  {
    key: "inside-oven",
    name: "Inside Oven",
    description: "Remove grease and residue from accessible oven racks and interior surfaces.",
    price: 18,
    extraDurationMinutes: 40,
    maxQuantity: 2,
  },
  {
    key: "microwave",
    name: "Microwave Interior",
    description: "Clean the microwave interior, turntable, door, and accessible vents.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 3,
  },
  {
    key: "dishwasher",
    name: "Dishwasher Interior",
    description: "Wipe racks, seals, filter area, door edges, and accessible dishwasher surfaces.",
    price: 14,
    extraDurationMinutes: 25,
    maxQuantity: 2,
  },
  {
    key: "range-hood",
    name: "Range Hood Degreasing",
    description: "Degrease the accessible hood exterior, underside, and removable filter surfaces.",
    price: 16,
    extraDurationMinutes: 30,
    maxQuantity: 2,
  },
  {
    key: "cabinet-exterior",
    name: "Kitchen Cabinet Exteriors",
    description: "Detail cabinet doors, handles, kickboards, and exterior kitchen surfaces.",
    price: 20,
    extraDurationMinutes: 35,
    maxQuantity: 2,
  },
  {
    key: "cabinet-interior",
    name: "Inside Kitchen Cabinets",
    description: "Clean empty accessible cabinet shelves, drawers, interiors, and hinges.",
    price: 28,
    extraDurationMinutes: 50,
    maxQuantity: 2,
  },
  {
    key: "pantry",
    name: "Pantry Shelf Reset",
    description: "Wipe empty accessible pantry shelves and return supplied items neatly.",
    price: 18,
    extraDurationMinutes: 35,
    maxQuantity: 2,
  },
  {
    key: "backsplash-grout",
    name: "Kitchen Backsplash and Grout",
    description: "Detail backsplash surfaces and accessible grout lines behind preparation areas.",
    price: 16,
    extraDurationMinutes: 30,
    maxQuantity: 2,
  },
  {
    key: "small-appliances",
    name: "Small Appliance Exteriors",
    description:
      "Detail accessible kettles, coffee machines, toasters, and similar appliance exteriors.",
    price: 5,
    extraDurationMinutes: 10,
    maxQuantity: 8,
  },
  {
    key: "interior-windows",
    name: "Interior Windows",
    description: "Clean interior glass, frames, and accessible window edges.",
    price: 6,
    extraDurationMinutes: 15,
    maxQuantity: 20,
  },
  {
    key: "exterior-windows",
    name: "Accessible Exterior Windows",
    description: "Clean safely reachable exterior glass without specialist height equipment.",
    price: 8,
    extraDurationMinutes: 18,
    maxQuantity: 20,
  },
  {
    key: "window-tracks",
    name: "Window Track Detailing",
    description: "Vacuum and wipe accessible window tracks, corners, and sills.",
    price: 4,
    extraDurationMinutes: 10,
    maxQuantity: 20,
  },
  {
    key: "glass-partitions",
    name: "Glass Doors and Partitions",
    description: "Clean glass doors, office partitions, and reachable glass panels.",
    price: 7,
    extraDurationMinutes: 12,
    maxQuantity: 20,
  },
  {
    key: "blinds",
    name: "Blinds Dusting",
    description: "Dust and wipe suitable accessible blind slats and controls.",
    price: 7,
    extraDurationMinutes: 15,
    maxQuantity: 15,
  },
  {
    key: "curtains",
    name: "Curtain Vacuuming",
    description: "Low-suction vacuuming for suitable hanging curtains and fabric panels.",
    price: 10,
    extraDurationMinutes: 20,
    maxQuantity: 12,
  },
  {
    key: "baseboards",
    name: "Baseboards and Trim",
    description: "Detail baseboards, trim, corners, and accessible wall edges.",
    price: 12,
    extraDurationMinutes: 25,
    maxQuantity: 8,
  },
  {
    key: "doors",
    name: "Interior Doors and Frames",
    description: "Clean door faces, frames, handles, and accessible upper edges.",
    price: 5,
    extraDurationMinutes: 12,
    maxQuantity: 20,
  },
  {
    key: "walls",
    name: "Wall Spot Cleaning",
    description: "Treat suitable light marks on washable painted wall areas.",
    price: 9,
    extraDurationMinutes: 20,
    maxQuantity: 10,
  },
  {
    key: "lights",
    name: "Light Fixtures",
    description: "Dust and wipe safely reachable light fittings and shades.",
    price: 6,
    extraDurationMinutes: 12,
    maxQuantity: 15,
  },
  {
    key: "fans",
    name: "Ceiling Fans",
    description: "Dust and wipe safely reachable fan blades and housings.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 10,
  },
  {
    key: "balcony",
    name: "Balcony Cleaning",
    description: "Sweep and clean accessible balcony floors, railings, and surfaces.",
    price: 14,
    extraDurationMinutes: 30,
    maxQuantity: 5,
  },
  {
    key: "patio",
    name: "Patio or Terrace Cleaning",
    description: "Sweep, wash, and reset accessible patio or terrace floor areas.",
    price: 22,
    extraDurationMinutes: 45,
    maxQuantity: 4,
  },
  {
    key: "stairs",
    name: "Staircase Detailing",
    description: "Clean steps, risers, rails, corners, and landing surfaces.",
    price: 18,
    extraDurationMinutes: 35,
    maxQuantity: 5,
  },
  {
    key: "garage",
    name: "Garage Floor Sweep",
    description: "Sweep accessible garage floors and collect loose household debris.",
    price: 24,
    extraDurationMinutes: 45,
    maxQuantity: 3,
  },
  {
    key: "sofa",
    name: "Sofa Cleaning",
    description: "Vacuum and surface-clean suitable sofas, cushions, seams, and crevices.",
    price: 12,
    extraDurationMinutes: 25,
    maxQuantity: 8,
  },
  {
    key: "chair",
    name: "Upholstered Chair Cleaning",
    description: "Vacuum and surface-clean suitable upholstered dining or accent chairs.",
    price: 7,
    extraDurationMinutes: 15,
    maxQuantity: 20,
  },
  {
    key: "mattress",
    name: "Mattress Refresh",
    description: "Vacuum mattress faces, edges, seams, and suitable surface spots.",
    price: 18,
    extraDurationMinutes: 30,
    maxQuantity: 8,
  },
  {
    key: "headboard",
    name: "Fabric Headboard Cleaning",
    description: "Vacuum and refresh suitable upholstered headboards and seams.",
    price: 12,
    extraDurationMinutes: 20,
    maxQuantity: 8,
  },
  {
    key: "carpet",
    name: "Fitted Carpet Cleaning",
    description: "Deep vacuum and surface-treat fitted carpet areas by room.",
    price: 25,
    extraDurationMinutes: 45,
    maxQuantity: 10,
  },
  {
    key: "rug",
    name: "Area Rug Cleaning",
    description: "Vacuum and surface-clean suitable area rugs by piece.",
    price: 16,
    extraDurationMinutes: 30,
    maxQuantity: 12,
  },
  {
    key: "pet-hair",
    name: "Intensive Pet Hair Removal",
    description: "Focused pet-hair removal from suitable floors, furniture, and fabric surfaces.",
    price: 20,
    extraDurationMinutes: 40,
    maxQuantity: 4,
  },
  {
    key: "fabric-spot",
    name: "Fabric Spot Treatment",
    description: "Focused treatment for suitable small spots on upholstery or carpet.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 10,
  },
  {
    key: "shower-glass",
    name: "Shower Glass Descaling",
    description: "Focused mineral-buildup treatment on suitable shower glass.",
    price: 14,
    extraDurationMinutes: 25,
    maxQuantity: 5,
  },
  {
    key: "bath-grout",
    name: "Bathroom Grout Detailing",
    description: "Detailed brushing of accessible bathroom tile grout lines.",
    price: 18,
    extraDurationMinutes: 35,
    maxQuantity: 5,
  },
  {
    key: "bath-cabinets",
    name: "Inside Bathroom Cabinets",
    description: "Clean empty accessible vanity drawers, shelves, and cabinet interiors.",
    price: 14,
    extraDurationMinutes: 25,
    maxQuantity: 5,
  },
  {
    key: "laundry",
    name: "Laundry Wash and Fold",
    description: "Wash, dry where available, and fold one standard household laundry load.",
    price: 12,
    extraDurationMinutes: 25,
    maxQuantity: 6,
  },
  {
    key: "ironing",
    name: "Ironing Service",
    description: "Iron a selected set of suitable everyday garments.",
    price: 15,
    extraDurationMinutes: 35,
    maxQuantity: 6,
  },
  {
    key: "linen",
    name: "Bed Linen Change",
    description: "Remove used linen and remake beds with clean customer-supplied sets.",
    price: 6,
    extraDurationMinutes: 12,
    maxQuantity: 12,
  },
  {
    key: "dishes",
    name: "Dishwashing",
    description: "Wash or load a standard batch of dishes and reset the sink area.",
    price: 10,
    extraDurationMinutes: 25,
    maxQuantity: 5,
  },
  {
    key: "bins",
    name: "Trash Bin Sanitizing",
    description: "Wash and sanitize accessible household or office waste bins.",
    price: 5,
    extraDurationMinutes: 10,
    maxQuantity: 12,
  },
  {
    key: "organization",
    name: "Light Room Organization",
    description: "Neatly reset visible items and clear accessible everyday clutter.",
    price: 18,
    extraDurationMinutes: 35,
    maxQuantity: 8,
  },
  {
    key: "workstations",
    name: "Workstation Disinfection",
    description: "Detail high-touch desk surfaces, phones, keyboards, and chair contact points.",
    price: 6,
    extraDurationMinutes: 12,
    maxQuantity: 30,
  },
  {
    key: "meeting-room",
    name: "Meeting Room Reset",
    description: "Clean tables, chairs, boards, touchpoints, and presentation surfaces.",
    price: 18,
    extraDurationMinutes: 30,
    maxQuantity: 8,
  },
  {
    key: "break-room",
    name: "Office Break Room Detail",
    description: "Detail counters, sink, appliance exteriors, tables, and cabinet fronts.",
    price: 22,
    extraDurationMinutes: 40,
    maxQuantity: 4,
  },
  {
    key: "shelves",
    name: "Display and Shelf Detailing",
    description: "Dust and wipe empty or accessible retail, office, or home shelving.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 20,
  },
  {
    key: "fine-dust",
    name: "Fine Dust Second Pass",
    description: "An additional detailed pass for persistent renovation or construction dust.",
    price: 35,
    extraDurationMinutes: 60,
    maxQuantity: 4,
  },
  {
    key: "adhesive",
    name: "Label and Adhesive Removal",
    description: "Remove suitable labels and light adhesive residue from safe surfaces.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 15,
  },
  {
    key: "paint-spots",
    name: "Light Paint Spot Removal",
    description: "Treat suitable small paint specks on durable finished surfaces.",
    price: 15,
    extraDurationMinutes: 30,
    maxQuantity: 8,
  },
  {
    key: "debris",
    name: "Extra Debris Bagging",
    description: "Collect and bag additional light non-hazardous renovation or event debris.",
    price: 8,
    extraDurationMinutes: 15,
    maxQuantity: 15,
  },
  {
    key: "restock",
    name: "Guest Supply Restocking",
    description: "Place and arrange customer-supplied guest toiletries and consumables.",
    price: 10,
    extraDurationMinutes: 20,
    maxQuantity: 5,
  },
  {
    key: "guest-styling",
    name: "Guest-Ready Styling",
    description: "Final presentation reset for cushions, throws, towels, and visible amenities.",
    price: 12,
    extraDurationMinutes: 20,
    maxQuantity: 4,
  },
  {
    key: "event-tables",
    name: "Event Table and Chair Reset",
    description: "Wipe and return event tables and chairs to an orderly layout.",
    price: 20,
    extraDurationMinutes: 40,
    maxQuantity: 5,
  },
  {
    key: "high-touch",
    name: "Enhanced High-Touch Disinfection",
    description:
      "Focused disinfection of handles, switches, rails, counters, and shared touchpoints.",
    price: 18,
    extraDurationMinutes: 30,
    maxQuantity: 8,
  },
  {
    key: "classroom",
    name: "Classroom Desk and Chair Detail",
    description: "Clean student desks, chair surfaces, and shared classroom touchpoints.",
    price: 18,
    extraDurationMinutes: 35,
    maxQuantity: 10,
  },
  {
    key: "play-area",
    name: "Play Area Surface Cleaning",
    description: "Clean accessible hard play surfaces, shelves, and child-height touchpoints.",
    price: 20,
    extraDurationMinutes: 40,
    maxQuantity: 8,
  },
];

const commonAddonKeys = [
  "interior-windows",
  "window-tracks",
  "baseboards",
  "doors",
  "walls",
  "lights",
  "bins",
  "organization",
];

const serviceAddonKeys: Record<string, string[]> = {
  "regular-home-cleaning": [
    "inside-fridge",
    "inside-oven",
    "microwave",
    "cabinet-exterior",
    "balcony",
    "sofa",
    "pet-hair",
    "laundry",
    "ironing",
    "linen",
    "dishes",
    "fans",
  ],
  "deep-cleaning": [
    "inside-fridge",
    "inside-oven",
    "dishwasher",
    "range-hood",
    "cabinet-interior",
    "backsplash-grout",
    "blinds",
    "curtains",
    "balcony",
    "patio",
    "sofa",
    "carpet",
    "bath-grout",
    "shower-glass",
  ],
  "move-in-move-out-cleaning": [
    "inside-fridge",
    "inside-oven",
    "dishwasher",
    "range-hood",
    "cabinet-interior",
    "pantry",
    "exterior-windows",
    "blinds",
    "balcony",
    "patio",
    "garage",
    "bath-cabinets",
    "fine-dust",
    "adhesive",
  ],
  "office-cleaning": [
    "glass-partitions",
    "blinds",
    "carpet",
    "workstations",
    "meeting-room",
    "break-room",
    "shelves",
    "high-touch",
    "dishes",
    "bins",
  ],
  "sofa-upholstery-cleaning": [
    "chair",
    "mattress",
    "headboard",
    "rug",
    "pet-hair",
    "fabric-spot",
    "curtains",
    "carpet",
  ],
  "post-construction-cleaning": [
    "exterior-windows",
    "glass-partitions",
    "window-tracks",
    "cabinet-interior",
    "fine-dust",
    "adhesive",
    "paint-spots",
    "debris",
    "garage",
    "patio",
    "bath-grout",
    "backsplash-grout",
  ],
  "airbnb-turnover-cleaning": [
    "inside-fridge",
    "inside-oven",
    "microwave",
    "linen",
    "laundry",
    "dishes",
    "restock",
    "guest-styling",
    "sofa",
    "rug",
    "balcony",
    "pet-hair",
  ],
  "villa-cleaning": [
    "inside-fridge",
    "inside-oven",
    "cabinet-exterior",
    "exterior-windows",
    "blinds",
    "curtains",
    "balcony",
    "patio",
    "stairs",
    "garage",
    "sofa",
    "carpet",
    "laundry",
    "linen",
    "fans",
  ],
  "kitchen-intensive-cleaning": [
    "inside-fridge",
    "inside-oven",
    "microwave",
    "dishwasher",
    "range-hood",
    "cabinet-exterior",
    "cabinet-interior",
    "pantry",
    "backsplash-grout",
    "small-appliances",
    "dishes",
    "bins",
  ],
  "bathroom-sanitizing": [
    "shower-glass",
    "bath-grout",
    "bath-cabinets",
    "high-touch",
    "walls",
    "doors",
    "window-tracks",
    "bins",
  ],
  "window-glass-cleaning": [
    "interior-windows",
    "exterior-windows",
    "window-tracks",
    "glass-partitions",
    "blinds",
    "shower-glass",
    "lights",
  ],
  "carpet-rug-cleaning": [
    "carpet",
    "rug",
    "sofa",
    "chair",
    "pet-hair",
    "fabric-spot",
    "mattress",
    "curtains",
  ],
  "mattress-refresh-cleaning": [
    "mattress",
    "headboard",
    "linen",
    "pet-hair",
    "fabric-spot",
    "rug",
    "curtains",
  ],
  "after-event-cleanup": [
    "dishes",
    "event-tables",
    "debris",
    "bins",
    "carpet",
    "rug",
    "sofa",
    "balcony",
    "patio",
    "glass-partitions",
    "high-touch",
  ],
  "retail-store-cleaning": [
    "exterior-windows",
    "glass-partitions",
    "blinds",
    "carpet",
    "shelves",
    "high-touch",
    "workstations",
    "bins",
  ],
  "clinic-wellness-sanitizing": [
    "glass-partitions",
    "blinds",
    "workstations",
    "high-touch",
    "meeting-room",
    "shelves",
    "bins",
    "carpet",
  ],
  "school-daycare-cleaning": [
    "classroom",
    "play-area",
    "high-touch",
    "glass-partitions",
    "carpet",
    "rug",
    "shelves",
    "bins",
    "walls",
  ],
  "eco-friendly-home-cleaning": [
    "inside-fridge",
    "inside-oven",
    "microwave",
    "cabinet-exterior",
    "balcony",
    "sofa",
    "rug",
    "pet-hair",
    "laundry",
    "linen",
    "organization",
  ],
};

async function seedCatalog() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from .env.local");
  }

  await mongoose.connect(mongoUri);

  try {
    const database = mongoose.connection.db;

    if (!database) {
      throw new Error("MongoDB did not provide an active database connection");
    }

    const now = new Date();
    const servicesCollection = database.collection("services");
    const addonsCollection = database.collection("addons");
    const linksCollection = database.collection("serviceaddons");

    const serviceResult = await servicesCollection.bulkWrite(
      services.map((service) => ({
        updateOne: {
          filter: { slug: service.slug },
          update: {
            $set: {
              ...service,
              imageUrl: "",
              isActive: true,
              includedSquareMeters: 60,
              pricePerAdditionalSquareMeter: 0.4,
              minutesPerAdditionalSquareMeter: 0.75,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      }))
    );

    const addonResult = await addonsCollection.bulkWrite(
      addons.map(({ key: _key, ...addon }) => ({
        updateOne: {
          filter: { name: addon.name },
          update: {
            $set: {
              ...addon,
              isActive: true,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      }))
    );

    const serviceDocuments = await servicesCollection
      .find({ slug: { $in: services.map((service) => service.slug) } })
      .project({ _id: 1, slug: 1 })
      .toArray();
    const addonDocuments = await addonsCollection
      .find({ name: { $in: addons.map((addon) => addon.name) } })
      .project({ _id: 1, name: 1 })
      .toArray();

    const serviceIds = new Map(
      serviceDocuments.map((service) => [String(service.slug), service._id])
    );
    const addonIds = new Map(addonDocuments.map((addon) => [String(addon.name), addon._id]));
    const addonByKey = new Map(addons.map((addon) => [addon.key, addon]));

    const linkOperations = services.flatMap((service) => {
      const requestedKeys = [
        ...new Set([...commonAddonKeys, ...(serviceAddonKeys[service.slug] ?? [])]),
      ];

      return requestedKeys.map((key, index) => {
        const addon = addonByKey.get(key);
        const serviceId = serviceIds.get(service.slug);
        const addonId = addon ? addonIds.get(addon.name) : undefined;

        if (!serviceId || !addonId) {
          throw new Error(`Could not link ${service.slug} to add-on ${key}`);
        }

        return {
          updateOne: {
            filter: { serviceId, addonId },
            update: {
              $set: {
                isActive: true,
                sortOrder: index + 1,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
              $unset: {
                overridePrice: "",
                overrideDurationMinutes: "",
                maxQuantity: "",
              },
            },
            upsert: true,
          },
        };
      });
    });

    const linkResult = await linksCollection.bulkWrite(linkOperations);

    console.log("CleanNest catalog seeded successfully.");
    console.log(`Services available: ${services.length}`);
    console.log(`New services: ${serviceResult.upsertedCount}`);
    console.log(`Extra touches available: ${addons.length}`);
    console.log(`New extra touches: ${addonResult.upsertedCount}`);
    console.log(`Service-specific links configured: ${linkOperations.length}`);
    console.log(`New links: ${linkResult.upsertedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

seedCatalog().catch((error: unknown) => {
  console.error("Catalog seed failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
