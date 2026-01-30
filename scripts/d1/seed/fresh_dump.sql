PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_init.sql','2026-01-23 02:27:59');
INSERT INTO "d1_migrations" VALUES(2,'0002_drop_catalog_pricing_columns.sql','2026-01-23 02:48:13');
INSERT INTO "d1_migrations" VALUES(3,'0003_add_cascade.sql','2026-01-23 16:00:42');
INSERT INTO "d1_migrations" VALUES(4,'0004_add_tickets.sql','2026-01-23 17:14:42');
INSERT INTO "d1_migrations" VALUES(5,'0005_add_catalog_stone_options.sql','2026-01-23 22:38:01');
INSERT INTO "d1_migrations" VALUES(6,'0006_simplify_catalog_items.sql','2026-01-23 22:38:02');
INSERT INTO "d1_migrations" VALUES(7,'0007_drop_catalog_short_desc.sql','2026-01-23 22:51:29');
INSERT INTO "d1_migrations" VALUES(8,'0008_drop_catalog_quality_ranges.sql','2026-01-23 22:56:46');
INSERT INTO "d1_migrations" VALUES(9,'0009_drop_catalog_hero_image.sql','2026-01-24 00:08:04');
INSERT INTO "d1_migrations" VALUES(10,'0010_drop_catalog_collection.sql','2026-01-24 00:15:09');
INSERT INTO "d1_migrations" VALUES(11,'0011_move_catalog_descriptions_drop_palette.sql','2026-01-24 00:31:31');
INSERT INTO "d1_migrations" VALUES(12,'0012_simplify_catalog_stone_options.sql','2026-01-24 00:46:04');
INSERT INTO "d1_migrations" VALUES(13,'0013_move_stone_weight_to_options.sql','2026-01-24 01:14:20');
INSERT INTO "d1_migrations" VALUES(14,'0014_drop_stone_option_quality_fields.sql','2026-01-24 01:22:19');
INSERT INTO "d1_migrations" VALUES(15,'0015_move_metal_weight_to_options.sql','2026-01-24 01:33:13');
INSERT INTO "d1_migrations" VALUES(16,'0016_create_catalog_metal_options.sql','2026-01-24 01:54:47');
INSERT INTO "d1_migrations" VALUES(17,'0017_replace_catalog_media_schema.sql','2026-01-24 02:41:47');
INSERT INTO "d1_migrations" VALUES(18,'0018_make_catalog_media_catalog_id_not_null.sql','2026-01-24 02:41:48');
INSERT INTO "d1_migrations" VALUES(19,'0019_split_catalog_metal_options.sql','2026-01-24 02:49:31');
INSERT INTO "d1_migrations" VALUES(20,'0020_rename_option_notes_to_size_type.sql','2026-01-24 06:50:55');
CREATE TABLE media_library (
  media_id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  media_type TEXT,
  label TEXT,
  alt TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "media_library" VALUES('products_men_bands_hw-001_img-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_bands_hw-001_img-1.jpeg','image','Yellow','Men''s Ring in Yellow Gold','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_bands_hw-002_img-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_bands_hw-002_img-1.jpeg','image','Two Tone','Men''s Band in Two Tone Yellow and White Gold.','The Azure Solitaire ring from Heerawalla is a stunning men''s band crafted in two-tone yellow and white gold. This elegant piece features a brilliant cut, showcasing the beauty of natural or lab-grown diamonds in a range of clarity and color options.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-001_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-001_img-bracelet-1.png','image','bracelet-1','The bracelet traces the wrist with a clean line and measured brilliance. It maintains the Axis cadence without excess.','The bracelet traces the wrist with a clean line and measured brilliance. It maintains the Axis cadence without excess.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-001_img-bracelet-2','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-001_img-bracelet-2.jpeg','image','bracelet-2','A second bracelet view emphasizes the linear profile and restrained diamond cadence that define the Axis signature.','A second bracelet view emphasizes the linear profile and restrained diamond cadence that define the Axis signature.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-001_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-001_img-hero-1.png','image','hero-1','Axis composition in the Men''s Edition. Structured lines and restrained diamonds create a steady, grounded presence.','Axis composition in the Men''s Edition. Structured lines and restrained diamonds create a steady, grounded presence.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-001_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-001_img-pendant-1.png','image','pendant-1','The pendant carries Axis with a centered focal point and precise alignment of diamonds. Its presence is calm and architectural.','The pendant carries Axis with a centered focal point and precise alignment of diamonds. Its presence is calm and architectural.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-001_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-001_img-ring-1.png','image','ring-1','The composition reads as a quiet statement, anchored by symmetry and balance. It is direct, refined, and enduring.','The composition reads as a quiet statement, anchored by symmetry and balance. It is direct, refined, and enduring.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-002_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-002_img-bracelet-1.jpeg','image','Men''s Bracelet in Yellow Gold','The bracelet echo Eclipse · Sovereign with controlled brilliance and a decisive silhouette. A refined accent, never excessive.','Bracelet. Gleaming in a warm yellow gold tone, this substantial piece features a classic curb link design. The interlocking links create a smooth, weighty feel, forming a continuous band of polished metal. The secure clasp, subtly engraved, completes the bracelet''s refined silhouette.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-002_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-002_img-hero-1.jpeg','image','Composition in Yellow Gold','Eclipse - Sovereign in the Men''s Edition. A wealthy, bold presence defined by heavy gold: bracelet, pendant, chain, and ring—solid, commanding, and unapologetic.','Ring. This bold statement piece features a polished gold tone setting, encircling a striking dark cabochon stone. A halo of shimmering stones adds a touch of brilliance, catching the light with every movement. The ring''s substantial silhouette exudes confidence and undeniable style.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-002_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-002_img-pendant-1.jpeg','image','Yellow Gold Men''s Pendant','The pendant carries Eclipse · Sovereign with a centered solitaire and measured tension. The light stays crisp and deliberate.','Pendant. Gleaming in a warm gold tone, this piece presents a unique silhouette. The padlock form is lavishly paved with a grid of shimmering stones, catching the light with every facet. A delicate row of gems also adorns the bail, completing the design with a touch of refined elegance.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_men_sets_hms-002_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_men_sets_hms-002_img-ring-1.jpeg','image','Yellow Gold Men''s Signature Ring','The ring completes Eclipse · Sovereign with a bold solitaire and a precise, architectural band.','Ring. Gleaming in a warm yellow gold tone, this piece features a striking circular silhouette. A smooth, dark cabochon is embraced by a delicate halo of shimmering stones, creating a captivating contrast of light and shadow. The architectural band adds a touch of modern sophistication to this timeless design.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-001_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-001_img-hero-1.jpeg','image','hero-1',replace('Designed for those who value meaning as much as elegance, this pendant is a modern symbol of balance, identity, and quiet confidence. Its refined geometry - defined by a vertical line intersecting a perfect circle - represents alignment, purpose, and continuity, making it more than an accessory; it is a personal signature.\n\nCrafted in polished white gold and accented with a precisely set diamond, the pendant delivers subtle brilliance without excess. Its proportions are intentionally restrained, allowing it to sit naturally at the collarbone and layer effortlessly with other pieces, or stand alone as a statement of refined taste.\n\nThis is jewelry designed to be worn daily, collected intentionally, and kept for years.','\n',char(10)),'Designed for those who value meaning as much as elegance, this pendant is a modern symbol of balance, identity, and quiet confidence. Its refined geometry - defined by a vertical line intersecting a perfect circle - represents alignment, purpose, and continuity, making it more than an accessory; it is a personal signature. Crafted in polished white gold and accented with a precisely set diamond, the pendant delivers subtle brilliance without excess. Its proportions are intentionally restrained, allowing it to sit naturally at the collarbone and layer effortlessly with other pieces, or stand alone as a statement of refined taste. This is jewelry designed to be worn daily, collected intentionally, and kept for years.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-001_img-hero-2','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-001_img-hero-2.jpeg','image','hero-2','hero-2','The Axis Emblem Pendant is a stunning piece of fine jewelry that exudes elegance and sophistication. Crafted with precision and attention to detail, this pendant features a beautiful design that is sure to captivate anyone who lays eyes on it.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-001_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-001_img-pendant-1.jpeg','image','pendant-1','pendant-1','This exquisite Axis Emblem Pendant is a testament to refined elegance, featuring a stunning axis design adorned with natural diamonds in brilliant cut, showcasing a range of clarity grades from IF to SI3 and color grades from D to I. Suspended from a sleek chain, this pendant is a masterful blend of form and function, perfect for those who appreciate understated sophistication.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-001_img-pendant-2','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-001_img-pendant-2.jpeg','image','pendant-2',replace(replace('Designed for those who value meaning as much as elegance, this pendant is a modern symbol of balance, identity, and quiet confidence. Its refined geometry—defined by a vertical line intersecting a perfect circle—represents alignment, purpose, and continuity, making it more than an accessory; it is a personal signature.\r\n\r\nCrafted in polished white gold and accented with a precisely set diamond, the pendant delivers subtle brilliance without excess. Its proportions are intentionally restrained, allowing it to sit naturally at the collarbone and layer effortlessly with other pieces, or stand alone as a statement of refined taste.\r\n\r\nThis is jewelry designed to be worn daily, collected intentionally, and kept for years.','\r',char(13)),'\n',char(10)),'Designed for those who value meaning as much as elegance, this pendant is a modern symbol of balance, identity, and quiet confidence. Its refined geometry—defined by a vertical line intersecting a perfect circle—represents alignment, purpose, and continuity, making it more than an accessory; it is a personal signature. Crafted in polished white gold and accented with a precisely set diamond, the pendant delivers subtle brilliance without excess. Its proportions are intentionally restrained, allowing it to sit naturally at the collarbone and layer effortlessly with other pieces, or stand alone as a statement of refined taste. This is jewelry designed to be worn daily, collected intentionally, and kept for years.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-001_img-pendant-3','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-001_img-pendant-3.png','image','pendant-3','Discreetly engraved on the back with the HEERAWALLA authenticity mark, each pendant carries a promise of craftsmanship, originality, and timeless design. Gender-neutral and versatile, it transitions seamlessly from day to evening, casual to formal—making it an essential addition to any pendant collection.','Discreetly engraved on the back with the HEERAWALLA authenticity mark, each pendant carries a promise of craftsmanship, originality, and timeless design. Gender-neutral and versatile, it transitions seamlessly from day to evening, casual to formal—making it an essential addition to any pendant collection.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-002_img-hero-03','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-002_img-hero-03.jpeg','image','hero-03','hero-03','The Axis Meridian Pendant is a stunning piece of jewelry that exudes elegance and sophistication. Crafted with precision, this unisex pendant features a brilliant cut diamond at its center, surrounded by a delicate chain that adds a touch of refinement to any outfit.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-002_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-002_img-hero-1.png','image','hero-1',replace('This pendant is designed around balance and intention. The circular form symbolizes continuity and wholeness, while the vertical axis introduces purpose, direction, and personal grounding. Together, they create a form that feels calm, centered, and timeless - never loud, yet instantly distinctive.\n\nWorn on the body, it feels natural and personal. The dime-sized scale keeps it subtle enough for everyday wear, while the refined detailing - diamonds set with visible prongs, clean metal planes, and a precision-engraved signature mark - signals craftsmanship and authenticity. The reversible design adds depth: one side offers brilliance and light, the other a minimalist, symbolic expression of identity.\n\nIt is deliberately unisex, equally confident on men and women. Not trend-driven, but meaning-driven - something you wear because it resonates, and keep because it becomes part of your story.','\n',char(10)),'This pendant is designed around balance and intention. The circular form symbolizes continuity and wholeness, while the vertical axis introduces purpose, direction, and personal grounding. Together, they create a form that feels calm, centered, and timeless - never loud, yet instantly distinctive. Worn on the body, it feels natural and personal. The dime-sized scale keeps it subtle enough for everyday wear, while the refined detailing - diamonds set with visible prongs, clean metal planes, and a precision-engraved signature mark - signals craftsmanship and authenticity. The reversible design adds depth: one side offers brilliance and light, the other a minimalist, symbolic expression of identity. It is deliberately unisex, equally confident on men and women. Not trend-driven, but meaning-driven - something you wear because it resonates, and keep because it becomes part of your story.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-002_img-hero-2','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-002_img-hero-2.png','image','hero-2','hero-2','The Axis Meridian Pendant is a stunning piece of jewelry that exudes elegance and sophistication. Crafted with precision, this pendant features a brilliant cut diamond set in a sleek silver design, suspended from a delicate chain that adds a touch of refinement to any outfit.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-002_img-pendant-02','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-002_img-pendant-02.png','image','pendant-02','pendant-02','The Axis Meridian Pendant is a refined piece of jewelry that showcases the beauty of diamonds. Crafted with precision, this pendant features a stunning natural or lab-grown diamond at its center, surrounded by a delicate chain that adds a touch of elegance to any outfit.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_unisex_pendants_hwp-002_img-pendant-03','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_unisex_pendants_hwp-002_img-pendant-03.png','image','pendant-03','pendant-03','The Axis Meridian Pendant is a stunning piece of fine jewelry that exudes elegance and sophistication. Crafted with precision, this pendant features a sleek design and is adorned with natural or lab-grown diamonds, adding a touch of luxury to any outfit.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_pendants_hw-003_img-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_pendants_hw-003_img-1.png','image','1',replace('Defined by pure simplicity and enduring elegance, a single brilliant-cut diamond is secured in a minimal, refined mount that allows maximum light return, keeping the diamond the focal point.\n\nDesigned to be age-agnostic and effortlessly versatile, the pendant moves from a first meaningful gift to an everyday signature piece. Balanced proportions and a classic silhouette keep it timeless.\n\nSuspended on a delicate chain, the solitaire rests at the collarbone, ideal for daily wear, layering, or special occasions. It is understated for day and refined for evening.','\n',char(10)),'Defined by pure simplicity and enduring elegance, a single brilliant-cut diamond is secured in a minimal, refined mount that allows maximum light return, keeping the diamond the focal point. Designed to be age-agnostic and effortlessly versatile, the pendant moves from a first meaningful gift to an everyday signature piece. Balanced proportions and a classic silhouette keep it timeless. Suspended on a delicate chain, the solitaire rests at the collarbone, ideal for daily wear, layering, or special occasions. It is understated for day and refined for evening.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_pendants_hw-003_img-2','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_pendants_hw-003_img-2.png','image','2','What sets this piece apart is its clean solitaire setting, designed to maximize brilliance while keeping the metal presence minimal—allowing the diamond to remain the unmistakable focal point. Elegant and lightweight, it is crafted for effortless all-day comfort and everyday wear.','What sets this piece apart is its clean solitaire setting, designed to maximize brilliance while keeping the metal presence minimal—allowing the diamond to remain the unmistakable focal point. Elegant and lightweight, it is crafted for effortless all-day comfort and everyday wear.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_pendants_hw-003_img-3','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_pendants_hw-003_img-3.png','image','3','Thoughtfully proportioned and timeless in design, this pendant evolves with her both emotionally and stylistically, becoming a constant through every stage of life. It is a diamond she will never outgrow—because true simplicity, when done perfectly, never fades.','Thoughtfully proportioned and timeless in design, this pendant evolves with her both emotionally and stylistically, becoming a constant through every stage of life. It is a diamond she will never outgrow—because true simplicity, when done perfectly, never fades.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_pendants_hw-003_img-4','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_pendants_hw-003_img-4.png','image','4','The back of the pendant is intentionally clean and refined, designed to let the diamond take center stage without distraction. A minimal open-gallery allows light to flow freely through the stone, enhancing brilliance from every angle while reducing unnecessary metal weight. The discreet, low-profile setting sits flush against the skin for all-day comfort and a seamless look when worn. Every surface is smoothly finished, reflecting thoughtful craftsmanship and a commitment to understated elegance—proof that true luxury is just as beautiful where you don’t immediately look.','The back of the pendant is intentionally clean and refined, designed to let the diamond take center stage without distraction. A minimal open-gallery allows light to flow freely through the stone, enhancing brilliance from every angle while reducing unnecessary metal weight. The discreet, low-profile setting sits flush against the skin for all-day comfort and a seamless look when worn. Every surface is smoothly finished, reflecting thoughtful craftsmanship and a commitment to understated elegance—proof that true luxury is just as beautiful where you don’t immediately look.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_pendants_hw-003_img-5','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_pendants_hw-003_img-5.png','image','5','More than packaging—it’s part of the gift. Each pendant is presented in an elegant keepsake box, designed to elevate the moment it’s given. From the smooth exterior to the plush interior that highlights the diamond’s sparkle, the experience feels intentional, personal, and meaningful. Ready to gift, no wrapping required.','More than packaging—it’s part of the gift. Each pendant is presented in an elegant keepsake box, designed to elevate the moment it’s given. From the smooth exterior to the plush interior that highlights the diamond’s sparkle, the experience feels intentional, personal, and meaningful. Ready to gift, no wrapping required.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_rings_hw-002_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_rings_hw-002_img-hero-1.png','image','hero-1','hero-1','The Azure Solitaire ring features a stunning natural or lab-grown diamond, graded IF-VS3 and D-I in clarity and color, respectively, and cut into a brilliant round shape. Its elegant design is showcased on a female model, highlighting the ring''s sophistication and beauty.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_rings_hw-002_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_rings_hw-002_img-ring-1.png','image','ring-1','ring-1','The Azure Solitaire ring features a stunning, round-cut Natural Diamond or Lab Grown Diamond at its center, set in a sleek and elegant design. This timeless piece showcases the beauty of the diamond, with clarity and color options available to suit your personal taste.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-001_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-001_img-bracelet-1.png','image','bracelet-1','The bracelet presents Eclipse as a strong line of light across the wrist. It is bold, composed, and enduring.','The bracelet presents Eclipse as a strong line of light across the wrist. It is bold, composed, and enduring.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-001_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-001_img-earring-1.png','image','earring-1','The earrings bring Eclipse to the face with a pronounced glow and a poised outline. The effect is confident, never loud.','The earrings bring Eclipse to the face with a pronounced glow and a poised outline. The effect is confident, never loud.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-001_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-001_img-hero-1.png','image','hero-1','Eclipse composition in the Women''s Edition. Concentrated light and bold contrast create a magnetic presence.','Eclipse composition in the Women''s Edition. Concentrated light and bold contrast create a magnetic presence.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-001_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-001_img-pendant-1.png','image','pendant-1','The pendant distills Eclipse into a luminous focal point with depth held in balance. It feels bold yet controlled.','The pendant distills Eclipse into a luminous focal point with depth held in balance. It feels bold yet controlled.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-002_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-002_img-bracelet-1.png','image','bracelet-1','The bracelet moves with the wrist in a smooth, uninterrupted line. The diamonds read as a quiet stream of light.','The bracelet moves with the wrist in a smooth, uninterrupted line. The diamonds read as a quiet stream of light.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-002_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-002_img-earring-1.png','image','earring-1','The earrings extend the Continuum language with flowing symmetry and an even shimmer. They remain poised and effortless.','The earrings extend the Continuum language with flowing symmetry and an even shimmer. They remain poised and effortless.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-002_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-002_img-hero-1.png','image','hero-1','Continuum composition in the Women''s Edition. The diamonds read fluid, graceful, and continuous.','Continuum composition in the Women''s Edition. The diamonds read fluid, graceful, and continuous.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-002_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-002_img-pendant-1.png','image','pendant-1','The pendant follows the Continuum rhythm with a soft, continuous line and a gentle glow. Its proportions feel light and refined.','The pendant follows the Continuum rhythm with a soft, continuous line and a gentle glow. Its proportions feel light and refined.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-003_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-003_img-bracelet-1.png','image','bracelet-1','The bracelet delivers a steady line of brilliance along the wrist, measured and refined.','The bracelet delivers a steady line of brilliance along the wrist, measured and refined.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-003_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-003_img-earring-1.png','image','earring-1','The earrings reflect Axis through symmetry and clarity, offering a quiet, focused radiance.','The earrings reflect Axis through symmetry and clarity, offering a quiet, focused radiance.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-003_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-003_img-hero-1.png','image','hero-1','Axis composition in the Women''s Edition. Anchored geometry meets a clear, confident line of light.','Axis composition in the Women''s Edition. Anchored geometry meets a clear, confident line of light.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-003_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-003_img-pendant-1.png','image','pendant-1','The pendant centers the Axis language with precise alignment and a balanced glow. It feels composed and architectural.','The pendant centers the Axis language with precise alignment and a balanced glow. It feels composed and architectural.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-bracelet-1.png','image','bracelet-1','The bracelet traces the wrist in a smooth arc of light, restrained and continuous.','Bangle. This slender bracelet traces the wrist in a smooth arc of light, restrained and continuous. Crafted in warm yellow gold, two delicate rows of shimmering stones follow the curve of the bangle, catching the light with every movement. It is a subtle statement of refined elegance.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-composition-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-composition-1.png','image','composition-1','composition-1','Set. Gleaming in a warm gold tone, this collection exudes radiant elegance. Each piece showcases a central, pear-shaped gem embraced by a delicate halo of smaller stones, creating a captivating teardrop silhouette. The bangle features a continuous line of shimmering gems, while the pendant and earrings echo the same graceful, cascading design.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-earring-1.png','image','earring-1','The earrings mirror the Continuum flow with clean symmetry and a soft glow.','Earrings. These radiant, gold-toned earrings feature a classic silhouette. A trio of round stones descends to a pear-shaped drop, where a central pear-cut stone is embraced by concentric halos of smaller, shimmering stones. They mirror the Continuum flow with clean symmetry and a soft glow.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-hero-1.png','image','hero-1','Continuum composition in the Women''s Edition. Fluid symmetry and a calm line of diamonds define the profile.','Set. Gleaming in a warm, golden tone, this ensemble presents a study in pear-shaped symmetry. The pendant, ring, and earrings each showcase a central, luminous gem, framed by a delicate halo of smaller stones. The bracelet, a double row of shimmering brilliance, completes the composition with understated elegance, creating a fluid and harmonious silhouette.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-pendant-1.png','image','pendant-1','The pendant keeps the Continuum cadence with a focused, luminous center. The impression is light and refined.','Pendant. This golden-toned piece presents a classic silhouette with a modern touch. A pear-shaped central stone is embraced by a double halo of smaller, shimmering gems, creating a captivating play of light. The pendant suspends from a delicate chain, adding an element of refined elegance to any neckline.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-004_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-004_img-ring-1.png','image','ring-1','The ring completes the composition with a refined band of brilliance, designed for everyday ease.','Ring. Gleaming in a warm gold tone, this ring presents a captivating teardrop silhouette. A central pear-shaped gem is embraced by a double halo of smaller, brilliant stones, extending down the band itself. The ring completes the composition with a refined band of brilliance, designed for everyday ease.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-005_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-005_img-bracelet-1.png','image','Tennis Bracelet','The bracelet traces the wrist with an even line of light, staying disciplined and refined. Its presence remains measured and architectural.','The bracelet traces the wrist with an even line of light, staying disciplined and refined. Its presence remains measured and architectural.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-005_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-005_img-earring-1.jpeg','image','Tear Drop Earrings','The earrings echo Axis · Equilibria through balanced proportion and restrained sparkle. The effect is calm and exacting.','The earrings echo Axis · Equilibria through balanced proportion and restrained sparkle. The effect is calm and exacting.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-005_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-005_img-hero-1.png','image','Tear drop set','Axis - Equilibria in the Women''s Edition. Precise alignment and lab-grown diamonds deliver a poised, luminous presence.','Axis - Equilibria in the Women''s Edition. Precise alignment and lab-grown diamonds deliver a poised, luminous presence.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-005_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-005_img-pendant-1.jpeg','image','Tear drop pendant','The pendant carries Axis · Equilibria with a precise focal line and quiet brilliance. Lab-grown diamonds keep the light clean and controlled.','The pendant carries Axis · Equilibria with a precise focal line and quiet brilliance. Lab-grown diamonds keep the light clean and controlled.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-005_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-005_img-ring-1.jpeg','image','Tear drop or almond shaped ring','The ring completes the composition with a focused band of brilliance, designed for effortless daily wear.','The ring completes the composition with a focused band of brilliance, designed for effortless daily wear.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-006_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-006_img-bracelet-1.jpeg','image','bracelet-1','bracelet-1','This exquisite bracelet from Heerawalla showcases a stunning arrangement of natural or lab-grown diamonds, meticulously set in a brilliant cut design. The elegant silver setting and secure clasp add a touch of sophistication to this timeless piece, perfect for any occasion.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-006_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-006_img-earring-1.jpg','image','earring-1','earring-1','This image showcases a pair of elegant earrings featuring round-cut diamonds set in a sleek silver setting. The earrings are crafted with a four-prong setting, adding a touch of sophistication to their overall design. The diamonds are of exceptional quality, boasting a brilliant cut and a color grade of D, E, F, G, H, or I, with clarity grades ranging from IF to SI2.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-006_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-006_img-hero-1.jpeg','image','hero-1','Continuum - Solitaire shown in the Women''s Edition. Lab-grown diamonds flow in a clean, architectural line with a refined finish.','Set. Glimmering in a cool, silvery tone, this ensemble exudes understated elegance. A delicate chain suspends a single, brilliant solitaire pendant, mirroring the stud earrings that catch the light with every turn. The bracelet, a continuous stream of radiant stones, completes the set with a refined, architectural line.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-006_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-006_img-pendant-1.png','image','pendant-1','pendant-1','The Continuum Solitaire pendant features a stunning solitaire diamond, expertly set in a sleek and modern design. Crafted with precision and elegance, this timeless piece is sure to captivate and inspire.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-006_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-006_img-ring-1.jpeg','image','ring-1','ring-1','The Continuum Solitaire Ring by Heerawalla is a stunning piece of fine jewelry, featuring a brilliant-cut diamond set in a sleek and elegant design. This exquisite ring showcases a natural or lab-grown diamond, available in various clarity and color options, making it a timeless choice for any occasion.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-bracelet-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-bracelet-1.jpeg','image','bracelet-1','Slim bangle with a crossing pave motif, polished and balanced to Heerawalla standards.','Slim bangle with a crossing pave motif, polished and balanced to Heerawalla standards.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-earring-1.jpeg','image','earring-1','Twisted leaf earrings (variant) with a single pave ribbon for light and length. Balanced curves and clean edges, finished to Heerawalla standards.','Twisted leaf earrings (variant) with a single pave ribbon for light and length. Balanced curves and clean edges, finished to Heerawalla standards.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-engraving-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-engraving-1.png','image','engraving-1','Heerawalla signature engraving, a discreet mark of origin and finishing standards.','Heerawalla signature engraving, a discreet mark of origin and finishing standards.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-hero-1.png','image','hero-1','Continuum composition in 18K gold, the twist motif moving through earrings, pendant, ring, and bracelet with a clean pave line. Finished to Heerawalla standards of proportion, polish, and balance.','Continuum composition in 18K gold, the twist motif moving through earrings, pendant, ring, and bracelet with a clean pave line. Finished to Heerawalla standards of proportion, polish, and balance.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-pendant-1.png','image','pendant-1','A fluid pendant with a sculpted twist and pave spine, suspended on a fine chain. Proportions stay light, precise, and refined.','A fluid pendant with a sculpted twist and pave spine, suspended on a fine chain. Proportions stay light, precise, and refined.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-007_img-ring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-007_img-ring-1.png','image','ring-1','Double-band ring crossing into a pave wave, engineered for a smooth, continuous line. Polished to Heerawalla standards of balance and finish.','Double-band ring crossing into a pave wave, engineered for a smooth, continuous line. Polished to Heerawalla standards of balance and finish.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-008_img-earring-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-008_img-earring-1.jpeg','image','earring-1',replace(replace('The design feels fluid and intentional, built around motion rather than ornament. Its silhouette rises gently, suggesting growth, confidence, and self-possession, while the diamonds are restrained—used to create a soft, continuous glow instead of dramatic sparkle. Nothing feels excessive; every element has a purpose.\r\n\r\nOn the wearer, the jewelry reads as personal and refined. The pendant sits naturally, almost like a signature, and the earrings echo the same language with lightness and balance. Together, they feel contemporary, feminine, and composed—luxury that speaks through proportion, craftsmanship, and calm confidence rather than bold display.\r\n\r\nIt’s a piece that feels owned, not showcased.','\r',char(13)),'\n',char(10)),'The design feels fluid and intentional, built around motion rather than ornament. Its silhouette rises gently, suggesting growth, confidence, and self-possession, while the diamonds are restrained—used to create a soft, continuous glow instead of dramatic sparkle. Nothing feels excessive; every element has a purpose. On the wearer, the jewelry reads as personal and refined. The pendant sits naturally, almost like a signature, and the earrings echo the same language with lightness and balance. Together, they feel contemporary, feminine, and composed—luxury that speaks through proportion, craftsmanship, and calm confidence rather than bold display. It’s a piece that feels owned, not showcased.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-008_img-hero-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-008_img-hero-1.jpeg','image','hero-1',replace('A study in quiet elegance, this diamond pendant and earring set celebrates feminine strength through fluid form and restrained brilliance. Sculpted in polished white gold, the design traces a graceful, upward silhouette - symbolic of confidence, movement, and self-expression - while pave-set diamonds add a soft, luminous shimmer rather than overt sparkle.\n\nWorn close to the skin, the pendant rests delicately at the collarbone, balanced by subtly scaled drop earrings that frame the face without overpowering it. The proportions are intentionally refined, making the set equally suited for elevated daytime wear or understated evening elegance.\n\nFinished with a discreet engraved signature mark, the piece reflects craftsmanship, authenticity, and modern luxury - designed not to command attention, but to reward it.','\n',char(10)),'A study in quiet elegance, this diamond pendant and earring set celebrates feminine strength through fluid form and restrained brilliance. Sculpted in polished white gold, the design traces a graceful, upward silhouette - symbolic of confidence, movement, and self-expression - while pave-set diamonds add a soft, luminous shimmer rather than overt sparkle. Worn close to the skin, the pendant rests delicately at the collarbone, balanced by subtly scaled drop earrings that frame the face without overpowering it. The proportions are intentionally refined, making the set equally suited for elevated daytime wear or understated evening elegance. Finished with a discreet engraved signature mark, the piece reflects craftsmanship, authenticity, and modern luxury - designed not to command attention, but to reward it.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('products_women_sets_hws-008_img-pendant-1','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/products_women_sets_hws-008_img-pendant-1.jpeg','image','pendant-1',replace(replace('This design expresses modern femininity through movement and restraint. The flowing silhouette suggests grace and confidence, while the upward sweep conveys quiet strength and optimism. Diamonds are used with intention—softly pavé-set to create luminosity rather than excess—allowing the form to lead and the brilliance to follow.\r\n\r\nThe scale is refined and wearable, designed to feel personal rather than performative. On the body, the pendant rests naturally at the collarbone, while the earrings frame the face with lightness and poise. The overall impression is elegant, contemporary, and self-assured—luxury that feels lived-in, not ceremonial.\r\n\r\nIt is a piece meant to be noticed slowly, appreciated up close, and worn as an extension of the wearer rather than a statement over her.','\r',char(13)),'\n',char(10)),'This design expresses modern femininity through movement and restraint. The flowing silhouette suggests grace and confidence, while the upward sweep conveys quiet strength and optimism. Diamonds are used with intention—softly pavé-set to create luminosity rather than excess—allowing the form to lead and the brilliance to follow. The scale is refined and wearable, designed to feel personal rather than performative. On the body, the pendant rests naturally at the collarbone, while the earrings frame the face with lightness and poise. The overall impression is elegant, contemporary, and self-assured—luxury that feels lived-in, not ceremonial. It is a piece meant to be noticed slowly, appreciated up close, and worn as an extension of the wearer rather than a statement over her.','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0001','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0001.jpeg','image','insp-0001','insp-0001','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0002','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0002.jpeg','image','insp-0002','insp-0002','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0003','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0003.jpeg','image','insp-0003','insp-0003','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0004','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0004.png','image','insp-0004','insp-0004','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0005','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0005.png','image','insp-0005','insp-0005','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0006','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0006.png','image','insp-0006','insp-0006','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0007','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0007.png','image','insp-0007','insp-0007','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0008','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0008.jpeg','image','insp-0008','insp-0008','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0009','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0009.jpeg','image','insp-0009','insp-0009','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('inspirations_insp-0010','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/inspirations_insp-0010.png','image','insp-0010','insp-0010','','2026-01-24 05:40:10');
INSERT INTO "media_library" VALUES('hero-1-ml070plm','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/hero-1-ml070plm.jpeg','image','Hero wearing yellow pendant','hero wearing yellow pendant','Pendant. Glimmering in a warm, yellow gold tone, this pendant features a captivating central stone. The stone is embraced by an intricate, interwoven knot design, adding a touch of delicate elegance. The pendant gracefully suspends from a fine chain, completing a look of refined simplicity.','2026-01-30T01:17:05.737Z');
INSERT INTO "media_library" VALUES('rose-ml0776vo','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/rose-ml0776vo.jpeg','image','Rose','Hero waering rose gold pendant','Pendant. A delicate rose gold chain suspends a captivating knot design. The pendant features a central, brilliant stone embraced by four interwoven loops, each subtly accented with smaller, shimmering gems. The overall effect is one of understated elegance, catching the light with every movement.','2026-01-30T01:22:08.022Z');
INSERT INTO "media_library" VALUES('white-ml07a6nx','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/white-ml07a6nx.jpeg','image','White','Hero wearing white gold pendant','Pendant. This delicate piece features a cool white gold tone, lending a modern touch to a classic design. A bright central stone is embraced by four intertwined loops, each subtly accented with shimmering stones, creating a captivating floral silhouette that catches the light with every movement.','2026-01-30T01:24:27.719Z');
INSERT INTO "media_library" VALUES('white-ml07bpsr','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/white-ml07bpsr.jpeg','image','White','white gold knot pendant','Pendant. This delicate piece features a bright, white-toned metal forming an intricate knot design. Sparkling pavé accents trace the curves of the knot, drawing the eye toward a brilliant, centrally set stone. The pendant hangs gracefully from a fine, matching chain, creating a look of understated elegance.','2026-01-30T01:25:39.375Z');
INSERT INTO "media_library" VALUES('yellow-ml07elso','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/yellow-ml07elso.jpeg','image','Yellow','yellow gold knot pendant','Pendant. This radiant pendant features a warm yellow gold tone, fashioned into an elegant knot silhouette. The design is further enhanced by shimmering stones that trace the curves of the knot, drawing the eye to the brilliant central gem. It hangs gracefully from a delicate chain, promising a touch of refined sparkle with every movement.','2026-01-30T01:27:54.233Z');
INSERT INTO "media_library" VALUES('rose-ml07g3im','https://pub-0758b0d6fde14b47943c5b58be0ca424.r2.dev/media/library/rose-ml07g3im.jpeg','image','Rose','rose gold knot pendant','Pendant. This rose-toned pendant suspends from a delicate chain, catching the light with a warm glow. Its intricate knot design features interwoven strands, each subtly adorned with shimmering stones. At the heart of the knot, a central round stone radiates brilliance, drawing the eye to its captivating sparkle.','2026-01-30T01:29:03.555Z');
CREATE TABLE site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "site_config" VALUES('meta_title','Heerawalla | Fine jewelry crafted with precision','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('meta_description','Discover Heerawalla''s inspirational fine jewelry - ethical stones, precious metals, and timeless minimal silhouettes.','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('hero_title','Heirloom pieces for modern collectors','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('hero_subtitle','Hand-finished gold, diamonds, and precious stones with timeless minimalism.','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('hero_cta_label','View collections','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('hero_cta_link','/collections','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('contact_email','support@heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('webmail_compose_url','https://mail.google.com/mail/?view=cm&fs=1&to=','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('newsletter_email','info@heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('newsletter_subject','Join Heerawalla','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('newsletter_body','Please add me to the Heerawalla list.','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('orders_email','orders@heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('consultation_booking_link','https://calendar.google.com/calendar/appointments/schedules/AcZssZ0syAfIydQJsRwm2FovSPItSvwSQFRmytbKkOYUj5kUiPHhjOR2C_G90dnkPZk5c3np6Z7oZxj-?gv=true','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('calendar_api_base','https://admin-api.heerawalla.com/calendar','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('atelier_api_base','https://admin-api.heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('consultation_fee_mode','free','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('about_title','About Heerawalla','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('about_description','Heerawalla crafts minimal, luxurious jewelry with ethical sourcing and meticulous finishing.','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('order_confirmation_api_base','https://admin-api.heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('order_cancel_api_base','https://admin-api.heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('order_authenticity_api_base','https://admin-api.heerawalla.com','2026-01-23 02:33:39');
INSERT INTO "site_config" VALUES('quote_api_base','https://admin-api.heerawalla.com','2026-01-23 02:33:39');
CREATE TABLE cost_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value REAL NOT NULL,
  unit TEXT,
  notes TEXT
);
INSERT INTO "cost_chart" VALUES(30,'labor_cost_per_gram_usd',15,'USD/g','24K spot');
INSERT INTO "cost_chart" VALUES(31,'shipping_cost_usd',25,'USD/g','null');
INSERT INTO "cost_chart" VALUES(32,'price_premium_pct',10,'USD/g','null');
INSERT INTO "cost_chart" VALUES(33,'labor_margin_per_gram_pct',30,'percent','null');
INSERT INTO "cost_chart" VALUES(34,'time_cost_flat_usd',50,'USD','per order');
INSERT INTO "cost_chart" VALUES(35,'profit_margin_production_pct',15,'percent','null');
INSERT INTO "cost_chart" VALUES(36,'profit_margin_sales_pct',35,'percent','null');
INSERT INTO "cost_chart" VALUES(37,'friends_and_familty_discount_pct',5,'USD','null');
INSERT INTO "cost_chart" VALUES(38,'welcome_discount_pct',2,'percent','null');
INSERT INTO "cost_chart" VALUES(39,'max_discount_pct',5,'percent','null');
INSERT INTO "cost_chart" VALUES(40,'offer_code_discount_pct',1,'percent','null');
INSERT INTO "cost_chart" VALUES(41,'dollar_risk_pct',5,'percent','null');
INSERT INTO "cost_chart" VALUES(42,'labor_flat',35,'percent','null');
INSERT INTO "cost_chart" VALUES(43,'labor_per_ct',0,'percent','null');
INSERT INTO "cost_chart" VALUES(44,'labor_per_piece_usd',0,'percent','null');
INSERT INTO "cost_chart" VALUES(45,'tariff_percent',50,'USD','null');
INSERT INTO "cost_chart" VALUES(46,'time_cost_per_week_usd',10,'USD/ct','null');
INSERT INTO "cost_chart" VALUES(47,'rush_fee_percent',10,'USD/piece','null');
INSERT INTO "cost_chart" VALUES(48,'rush_fee_flat_usd',75,'percent','null');
INSERT INTO "cost_chart" VALUES(49,'gold_price_per_gram_usd',171.64,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(50,'platinum_price_per_gram_usd',100,'USD/g','null');
INSERT INTO "cost_chart" VALUES(51,'silver_price_per_gram_usd',3,'USD/g','null');
INSERT INTO "cost_chart" VALUES(52,'lab_diamonds_relative_cost_pct',20,'percent','Percent cost of natural diamonds');
INSERT INTO "cost_chart" VALUES(53,'chain_length_weight_step_g',0.25,'gram','null');
INSERT INTO "cost_chart" VALUES(54,'chain_length_base_inches',16,'inches','adjustment = max(0, (length - base) * step)');
INSERT INTO "cost_chart" VALUES(55,'ring_size_base',4.5,'null','null');
INSERT INTO "cost_chart" VALUES(56,'bracelet_size_base',4.5,'inches','null');
INSERT INTO "cost_chart" VALUES(57,'ring_size_weight_step_g',0.25,'gram','null');
INSERT INTO "cost_chart" VALUES(58,'bracelet_size_weight_step_g',0.5,'gram','null');
INSERT INTO "cost_chart" VALUES(175,'price_gram_24k',171.64,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(176,'price_gram_22k',157.34,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(177,'price_gram_21k',150.18,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(178,'price_gram_20k',143.03,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(179,'price_gram_18k',128.73,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(180,'price_gram_16k',114.43,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(181,'price_gram_14k',100.12,'USD/g','2026-01-29');
INSERT INTO "cost_chart" VALUES(182,'price_gram_10k',71.52,'USD/g','2026-01-29');
CREATE TABLE diamond_price_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clarity TEXT NOT NULL,
  color TEXT NOT NULL,
  weight_min REAL NOT NULL,
  weight_max REAL NOT NULL,
  price_per_ct REAL NOT NULL,
  notes TEXT
);
INSERT INTO "diamond_price_chart" VALUES(757,'IF-VVS','D-F',0.01,0.03,830,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(758,'VS','D-F',0.01,0.03,730,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(759,'SI1','D-F',0.01,0.03,640,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(760,'SI2','D-F',0.01,0.03,560,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(761,'SI3','D-F',0.01,0.03,490,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(762,'I1','D-F',0.01,0.03,430,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(763,'I2','D-F',0.01,0.03,350,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(764,'I3','D-F',0.01,0.03,280,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(765,'IF-VVS','G-H',0.01,0.03,710,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(766,'VS','G-H',0.01,0.03,640,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(767,'SI1','G-H',0.01,0.03,570,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(768,'SI2','G-H',0.01,0.03,500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(769,'SI3','G-H',0.01,0.03,440,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(770,'I1','G-H',0.01,0.03,380,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(771,'I2','G-H',0.01,0.03,310,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(772,'I3','G-H',0.01,0.03,260,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(773,'IF-VVS','D-F',0.04,0.07,900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(774,'VS','D-F',0.04,0.07,790,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(775,'SI1','D-F',0.04,0.07,680,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(776,'SI2','D-F',0.04,0.07,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(777,'SI3','D-F',0.04,0.07,530,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(778,'I1','D-F',0.04,0.07,480,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(779,'I2','D-F',0.04,0.07,400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(780,'I3','D-F',0.04,0.07,310,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(781,'IF-VVS','G-H',0.04,0.07,770,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(782,'VS','G-H',0.04,0.07,690,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(783,'SI1','G-H',0.04,0.07,620,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(784,'SI2','G-H',0.04,0.07,550,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(785,'SI3','G-H',0.04,0.07,490,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(786,'I1','G-H',0.04,0.07,440,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(787,'I2','G-H',0.04,0.07,360,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(788,'I3','G-H',0.04,0.07,280,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(789,'IF-VVS','D-F',0.08,0.14,1060,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(790,'VS','D-F',0.08,0.14,960,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(791,'SI1','D-F',0.08,0.14,850,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(792,'SI2','D-F',0.08,0.14,760,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(793,'SI3','D-F',0.08,0.14,680,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(794,'I1','D-F',0.08,0.14,570,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(795,'I2','D-F',0.08,0.14,480,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(796,'I3','D-F',0.08,0.14,400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(797,'IF-VVS','G-H',0.08,0.14,880,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(798,'VS','G-H',0.08,0.14,820,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(799,'SI1','G-H',0.08,0.14,770,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(800,'SI2','G-H',0.08,0.14,690,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(801,'SI3','G-H',0.08,0.14,620,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(802,'I1','G-H',0.08,0.14,520,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(803,'I2','G-H',0.08,0.14,430,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(804,'I3','G-H',0.08,0.14,360,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(805,'IF-VVS','D-F',0.15,0.17,1250,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(806,'VS','D-F',0.15,0.17,1110,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(807,'SI1','D-F',0.15,0.17,980,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(808,'SI2','D-F',0.15,0.17,850,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(809,'SI3','D-F',0.15,0.17,760,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(810,'I1','D-F',0.15,0.17,640,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(811,'I2','D-F',0.15,0.17,520,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(812,'I3','D-F',0.15,0.17,440,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(813,'IF-VVS','G-H',0.15,0.17,1050,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(814,'VS','G-H',0.15,0.17,960,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(815,'SI1','G-H',0.15,0.17,870,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(816,'SI2','G-H',0.15,0.17,770,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(817,'SI3','G-H',0.15,0.17,680,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(818,'I1','G-H',0.15,0.17,570,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(819,'I2','G-H',0.15,0.17,470,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(820,'I3','G-H',0.15,0.17,400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(821,'IF-VVS','D-F',0.18,0.22,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(822,'VS','D-F',0.18,0.22,1260,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(823,'SI1','D-F',0.18,0.22,1110,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(824,'SI2','D-F',0.18,0.22,960,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(825,'SI3','D-F',0.18,0.22,840,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(826,'I1','D-F',0.18,0.22,690,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(827,'I2','D-F',0.18,0.22,560,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(828,'I3','D-F',0.18,0.22,480,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(829,'IF-VVS','G-H',0.18,0.22,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(830,'VS','G-H',0.18,0.22,1060,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(831,'SI1','G-H',0.18,0.22,950,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(832,'SI2','G-H',0.18,0.22,830,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(833,'SI3','G-H',0.18,0.22,730,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(834,'I1','G-H',0.18,0.22,630,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(835,'I2','G-H',0.18,0.22,510,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(836,'I3','G-H',0.18,0.22,430,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(837,'IF-VVS','D-F',0.23,0.29,1650,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(838,'VS','D-F',0.23,0.29,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(839,'SI1','D-F',0.23,0.29,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(840,'SI2','D-F',0.23,0.29,1090,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(841,'SI3','D-F',0.23,0.29,940,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(842,'I1','D-F',0.23,0.29,760,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(843,'I2','D-F',0.23,0.29,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(844,'I3','D-F',0.23,0.29,510,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(845,'IF-VVS','G-H',0.23,0.29,1350,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(846,'VS','G-H',0.23,0.29,1220,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(847,'SI1','G-H',0.23,0.29,1070,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(848,'SI2','G-H',0.23,0.29,920,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(849,'SI3','G-H',0.23,0.29,810,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(850,'I1','G-H',0.23,0.29,690,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(851,'I2','G-H',0.23,0.29,550,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(852,'I3','G-H',0.23,0.29,460,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(853,'IF','D',0.3,0.39,3100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(854,'VVS1','D',0.3,0.39,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(855,'VVS2','D',0.3,0.39,2200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(856,'VS1','D',0.3,0.39,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(857,'VS2','D',0.3,0.39,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(858,'SI1','D',0.3,0.39,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(859,'SI2','D',0.3,0.39,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(860,'SI3','D',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(861,'I1','D',0.3,0.39,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(862,'I2','D',0.3,0.39,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(863,'I3','D',0.3,0.39,700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(864,'IF','E',0.3,0.39,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(865,'VVS1','E',0.3,0.39,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(866,'VVS2','E',0.3,0.39,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(867,'VS1','E',0.3,0.39,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(868,'VS2','E',0.3,0.39,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(869,'SI1','E',0.3,0.39,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(870,'SI2','E',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(871,'SI3','E',0.3,0.39,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(872,'I1','E',0.3,0.39,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(873,'I2','E',0.3,0.39,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(874,'I3','E',0.3,0.39,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(875,'IF','F',0.3,0.39,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(876,'VVS1','F',0.3,0.39,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(877,'VVS2','F',0.3,0.39,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(878,'VS1','F',0.3,0.39,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(879,'VS2','F',0.3,0.39,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(880,'SI1','F',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(881,'SI2','F',0.3,0.39,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(882,'SI3','F',0.3,0.39,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(883,'I1','F',0.3,0.39,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(884,'I2','F',0.3,0.39,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(885,'I3','F',0.3,0.39,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(886,'IF','G',0.3,0.39,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(887,'VVS1','G',0.3,0.39,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(888,'VVS2','G',0.3,0.39,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(889,'VS1','G',0.3,0.39,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(890,'VS2','G',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(891,'SI1','G',0.3,0.39,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(892,'SI2','G',0.3,0.39,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(893,'SI3','G',0.3,0.39,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(894,'I1','G',0.3,0.39,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(895,'I2','G',0.3,0.39,900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(896,'I3','G',0.3,0.39,500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(897,'IF','H',0.3,0.39,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(898,'VVS1','H',0.3,0.39,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(899,'VVS2','H',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(900,'VS1','H',0.3,0.39,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(901,'VS2','H',0.3,0.39,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(902,'SI1','H',0.3,0.39,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(903,'SI2','H',0.3,0.39,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(904,'SI3','H',0.3,0.39,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(905,'I1','H',0.3,0.39,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(906,'I2','H',0.3,0.39,800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(907,'I3','H',0.3,0.39,500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(908,'IF','D',0.4,0.49,3500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(909,'VVS1','D',0.4,0.49,2900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(910,'VVS2','D',0.4,0.49,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(911,'VS1','D',0.4,0.49,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(912,'VS2','D',0.4,0.49,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(913,'SI1','D',0.4,0.49,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(914,'SI2','D',0.4,0.49,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(915,'SI3','D',0.4,0.49,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(916,'I1','D',0.4,0.49,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(917,'I2','D',0.4,0.49,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(918,'I3','D',0.4,0.49,800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(919,'IF','E',0.4,0.49,2900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(920,'VVS1','E',0.4,0.49,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(921,'VVS2','E',0.4,0.49,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(922,'VS1','E',0.4,0.49,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(923,'VS2','E',0.4,0.49,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(924,'SI1','E',0.4,0.49,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(925,'SI2','E',0.4,0.49,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(926,'SI3','E',0.4,0.49,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(927,'I1','E',0.4,0.49,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(928,'I2','E',0.4,0.49,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(929,'I3','E',0.4,0.49,700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(930,'IF','F',0.4,0.49,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(931,'VVS1','F',0.4,0.49,2400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(932,'VVS2','F',0.4,0.49,2200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(933,'VS1','F',0.4,0.49,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(934,'VS2','F',0.4,0.49,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(935,'SI1','F',0.4,0.49,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(936,'SI2','F',0.4,0.49,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(937,'SI3','F',0.4,0.49,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(938,'I1','F',0.4,0.49,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(939,'I2','F',0.4,0.49,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(940,'I3','F',0.4,0.49,700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(941,'IF','G',0.4,0.49,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(942,'VVS1','G',0.4,0.49,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(943,'VVS2','G',0.4,0.49,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(944,'VS1','G',0.4,0.49,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(945,'VS2','G',0.4,0.49,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(946,'SI1','G',0.4,0.49,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(947,'SI2','G',0.4,0.49,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(948,'SI3','G',0.4,0.49,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(949,'I1','G',0.4,0.49,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(950,'I2','G',0.4,0.49,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(951,'I3','G',0.4,0.49,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(952,'IF','H',0.4,0.49,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(953,'VVS1','H',0.4,0.49,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(954,'VVS2','H',0.4,0.49,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(955,'VS1','H',0.4,0.49,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(956,'VS2','H',0.4,0.49,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(957,'SI1','H',0.4,0.49,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(958,'SI2','H',0.4,0.49,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(959,'SI3','H',0.4,0.49,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(960,'I1','H',0.4,0.49,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(961,'I2','H',0.4,0.49,900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(962,'I3','H',0.4,0.49,600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(963,'IF','D',0.5,0.69,5500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(964,'VVS1','D',0.5,0.69,4600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(965,'VVS2','D',0.5,0.69,3600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(966,'VS1','D',0.5,0.69,3000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(967,'VS2','D',0.5,0.69,2700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(968,'SI1','D',0.5,0.69,2400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(969,'SI2','D',0.5,0.69,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(970,'SI3','D',0.5,0.69,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(971,'I1','D',0.5,0.69,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(972,'I2','D',0.5,0.69,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(973,'I3','D',0.5,0.69,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(974,'IF','E',0.5,0.69,4400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(975,'VVS1','E',0.5,0.69,4000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(976,'VVS2','E',0.5,0.69,3300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(977,'VS1','E',0.5,0.69,2800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(978,'VS2','E',0.5,0.69,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(979,'SI1','E',0.5,0.69,2200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(980,'SI2','E',0.5,0.69,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(981,'SI3','E',0.5,0.69,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(982,'I1','E',0.5,0.69,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(983,'I2','E',0.5,0.69,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(984,'I3','E',0.5,0.69,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(985,'IF','F',0.5,0.69,3800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(986,'VVS1','F',0.5,0.69,3500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(987,'VVS2','F',0.5,0.69,3000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(988,'VS1','F',0.5,0.69,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(989,'VS2','F',0.5,0.69,2400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(990,'SI1','F',0.5,0.69,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(991,'SI2','F',0.5,0.69,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(992,'SI3','F',0.5,0.69,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(993,'I1','F',0.5,0.69,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(994,'I2','F',0.5,0.69,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(995,'I3','F',0.5,0.69,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(996,'IF','G',0.5,0.69,3200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(997,'VVS1','G',0.5,0.69,2900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(998,'VVS2','G',0.5,0.69,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(999,'VS1','G',0.5,0.69,2400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1000,'VS2','G',0.5,0.69,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1001,'SI1','G',0.5,0.69,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1002,'SI2','G',0.5,0.69,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1003,'SI3','G',0.5,0.69,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1004,'I1','G',0.5,0.69,1300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1005,'I2','G',0.5,0.69,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1006,'I3','G',0.5,0.69,900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1007,'IF','H',0.5,0.69,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1008,'VVS1','H',0.5,0.69,2400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1009,'VVS2','H',0.5,0.69,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1010,'VS1','H',0.5,0.69,2200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1011,'VS2','H',0.5,0.69,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1012,'SI1','H',0.5,0.69,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1013,'SI2','H',0.5,0.69,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1014,'SI3','H',0.5,0.69,1400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1015,'I1','H',0.5,0.69,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1016,'I2','H',0.5,0.69,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1017,'I3','H',0.5,0.69,800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1018,'IF','D',0.7,0.89,7000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1019,'VVS1','D',0.7,0.89,5800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1020,'VVS2','D',0.7,0.89,4500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1021,'VS1','D',0.7,0.89,3900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1022,'VS2','D',0.7,0.89,3400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1023,'SI1','D',0.7,0.89,3100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1024,'SI2','D',0.7,0.89,2700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1025,'SI3','D',0.7,0.89,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1026,'I1','D',0.7,0.89,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1027,'I2','D',0.7,0.89,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1028,'I3','D',0.7,0.89,1200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1029,'IF','E',0.7,0.89,5700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1030,'VVS1','E',0.7,0.89,5100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1031,'VVS2','E',0.7,0.89,4200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1032,'VS1','E',0.7,0.89,3700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1033,'VS2','E',0.7,0.89,3200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1034,'SI1','E',0.7,0.89,2900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1035,'SI2','E',0.7,0.89,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1036,'SI3','E',0.7,0.89,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1037,'I1','E',0.7,0.89,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1038,'I2','E',0.7,0.89,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1039,'I3','E',0.7,0.89,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1040,'IF','F',0.7,0.89,5000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1041,'VVS1','F',0.7,0.89,4600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1042,'VVS2','F',0.7,0.89,4000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1043,'VS1','F',0.7,0.89,3500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1044,'VS2','F',0.7,0.89,3000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1045,'SI1','F',0.7,0.89,2700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1046,'SI2','F',0.7,0.89,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1047,'SI3','F',0.7,0.89,2100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1048,'I1','F',0.7,0.89,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1049,'I2','F',0.7,0.89,1700,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1050,'I3','F',0.7,0.89,1100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1051,'IF','G',0.7,0.89,4200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1052,'VVS1','G',0.7,0.89,3900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1053,'VVS2','G',0.7,0.89,3500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1054,'VS1','G',0.7,0.89,3200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1055,'VS2','G',0.7,0.89,2800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1056,'SI1','G',0.7,0.89,2500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1057,'SI2','G',0.7,0.89,2200,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1058,'SI3','G',0.7,0.89,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1059,'I1','G',0.7,0.89,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1060,'I2','G',0.7,0.89,1600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1061,'I3','G',0.7,0.89,1000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1062,'IF','H',0.7,0.89,3400,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1063,'VVS1','H',0.7,0.89,3100,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1064,'VVS2','H',0.7,0.89,2900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1065,'VS1','H',0.7,0.89,2800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1066,'VS2','H',0.7,0.89,2600,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1067,'SI1','H',0.7,0.89,2300,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1068,'SI2','H',0.7,0.89,2000,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1069,'SI3','H',0.7,0.89,1900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1070,'I1','H',0.7,0.89,1800,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1071,'I2','H',0.7,0.89,1500,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1072,'I3','H',0.7,0.89,900,'Rapaport 03/21/25 Rounds (converted from hundreds US$/ct). SI3 is split SI2/I1.');
INSERT INTO "diamond_price_chart" VALUES(1073,'I1','D',0.9,0.99,2900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1074,'I2','D',0.9,0.99,2200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1075,'I3','D',0.9,0.99,1500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1076,'IF','D',0.9,0.99,10400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1077,'SI1','D',0.9,0.99,4600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1078,'SI2','D',0.9,0.99,3800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1079,'SI3','D',0.9,0.99,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1080,'VS1','D',0.9,0.99,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1081,'VS2','D',0.9,0.99,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1082,'VVS1','D',0.9,0.99,9400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1083,'VVS2','D',0.9,0.99,7500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1084,'I1','E',0.9,0.99,2700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1085,'I2','E',0.9,0.99,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1086,'I3','E',0.9,0.99,1400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1087,'IF','E',0.9,0.99,9500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1088,'SI1','E',0.9,0.99,4200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1089,'SI2','E',0.9,0.99,3400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1090,'SI3','E',0.9,0.99,3100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1091,'VS1','E',0.9,0.99,5500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1092,'VS2','E',0.9,0.99,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1093,'VVS1','E',0.9,0.99,8600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1094,'VVS2','E',0.9,0.99,6900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1095,'I1','F',0.9,0.99,2600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1096,'I2','F',0.9,0.99,2000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1097,'I3','F',0.9,0.99,1300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1098,'IF','F',0.9,0.99,8700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1099,'SI1','F',0.9,0.99,3900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1100,'SI2','F',0.9,0.99,3100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1101,'SI3','F',0.9,0.99,2800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1102,'VS1','F',0.9,0.99,5100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1103,'VS2','F',0.9,0.99,4500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1104,'VVS1','F',0.9,0.99,8000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1105,'VVS2','F',0.9,0.99,6400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1106,'I1','G',0.9,0.99,2500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1107,'I2','G',0.9,0.99,1900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1108,'I3','G',0.9,0.99,1200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1109,'IF','G',0.9,0.99,6900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1110,'SI1','G',0.9,0.99,3600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1111,'SI2','G',0.9,0.99,2900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1112,'SI3','G',0.9,0.99,2700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1113,'VS1','G',0.9,0.99,4600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1114,'VS2','G',0.9,0.99,4200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1115,'VVS1','G',0.9,0.99,6400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1116,'VVS2','G',0.9,0.99,5500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1117,'I1','H',0.9,0.99,2400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1118,'I2','H',0.9,0.99,1800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1119,'I3','H',0.9,0.99,1200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1120,'IF','H',0.9,0.99,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1121,'SI1','H',0.9,0.99,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1122,'SI2','H',0.9,0.99,2700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1123,'SI3','H',0.9,0.99,2600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1124,'VS1','H',0.9,0.99,3900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1125,'VS2','H',0.9,0.99,3600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1126,'VVS1','H',0.9,0.99,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1127,'VVS2','H',0.9,0.99,4400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1128,'I1','D',1,1.49,3800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1129,'I2','D',1,1.49,2500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1130,'I3','D',1,1.49,1600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1131,'IF','D',1,1.49,16000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1132,'SI1','D',1,1.49,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1133,'SI2','D',1,1.49,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1134,'SI3','D',1,1.49,4300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1135,'VS1','D',1,1.49,8700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1136,'VS2','D',1,1.49,7300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1137,'VVS1','D',1,1.49,12800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1138,'VVS2','D',1,1.49,10200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1139,'I1','E',1,1.49,3500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1140,'I2','E',1,1.49,2400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1141,'I3','E',1,1.49,1500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1142,'IF','E',1,1.49,12500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1143,'SI1','E',1,1.49,5600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1144,'SI2','E',1,1.49,4500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1145,'SI3','E',1,1.49,4000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1146,'VS1','E',1,1.49,7900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1147,'VS2','E',1,1.49,6600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1148,'VVS1','E',1,1.49,11100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1149,'VVS2','E',1,1.49,9300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1150,'I1','F',1,1.49,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1151,'I2','F',1,1.49,2300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1152,'I3','F',1,1.49,1400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1153,'IF','F',1,1.49,10700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1154,'SI1','F',1,1.49,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1155,'SI2','F',1,1.49,4200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1156,'SI3','F',1,1.49,3700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1157,'VS1','F',1,1.49,7200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1158,'VS2','F',1,1.49,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1159,'VVS1','F',1,1.49,9700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1160,'VVS2','F',1,1.49,8400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1161,'I1','G',1,1.49,3100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1162,'I2','G',1,1.49,2200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1163,'I3','G',1,1.49,1300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1164,'IF','G',1,1.49,8200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1165,'SI1','G',1,1.49,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1166,'SI2','G',1,1.49,4000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1167,'SI3','G',1,1.49,3500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1168,'VS1','G',1,1.49,6200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1169,'VS2','G',1,1.49,5400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1170,'VVS1','G',1,1.49,7700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1171,'VVS2','G',1,1.49,7000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1172,'I1','H',1,1.49,2900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1173,'I2','H',1,1.49,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1174,'I3','H',1,1.49,1300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1175,'IF','H',1,1.49,6100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1176,'SI1','H',1,1.49,4400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1177,'SI2','H',1,1.49,3700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1178,'SI3','H',1,1.49,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1179,'VS1','H',1,1.49,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1180,'VS2','H',1,1.49,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1181,'VVS1','H',1,1.49,5800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1182,'VVS2','H',1,1.49,5500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1183,'I1','D',1.5,1.99,5700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1184,'I2','D',1.5,1.99,3500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1185,'I3','D',1.5,1.99,1800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1186,'IF','D',1.5,1.99,21000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1187,'SI1','D',1.5,1.99,9600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1188,'SI2','D',1.5,1.99,7800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1189,'SI3','D',1.5,1.99,6900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1190,'VS1','D',1.5,1.99,13400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1191,'VS2','D',1.5,1.99,12000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1192,'VVS1','D',1.5,1.99,18700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1193,'VVS2','D',1.5,1.99,15400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1194,'I1','E',1.5,1.99,5400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1195,'I2','E',1.5,1.99,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1196,'I3','E',1.5,1.99,1700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1197,'IF','E',1.5,1.99,18800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1198,'SI1','E',1.5,1.99,8900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1199,'SI2','E',1.5,1.99,7100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1200,'SI3','E',1.5,1.99,6300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1201,'VS1','E',1.5,1.99,12200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1202,'VS2','E',1.5,1.99,11000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1203,'VVS1','E',1.5,1.99,17300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1204,'VVS2','E',1.5,1.99,14300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1205,'I1','F',1.5,1.99,5100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1206,'I2','F',1.5,1.99,3200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1207,'I3','F',1.5,1.99,1600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1208,'IF','F',1.5,1.99,16400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1209,'SI1','F',1.5,1.99,8400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1210,'SI2','F',1.5,1.99,6700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1211,'SI3','F',1.5,1.99,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1212,'VS1','F',1.5,1.99,11400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1213,'VS2','F',1.5,1.99,10300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1214,'VVS1','F',1.5,1.99,15300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1215,'VVS2','F',1.5,1.99,13200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1216,'I1','G',1.5,1.99,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1217,'I2','G',1.5,1.99,3000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1218,'I3','G',1.5,1.99,1500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1219,'IF','G',1.5,1.99,13600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1220,'SI1','G',1.5,1.99,7800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1221,'SI2','G',1.5,1.99,6300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1222,'SI3','G',1.5,1.99,5700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1223,'VS1','G',1.5,1.99,9900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1224,'VS2','G',1.5,1.99,8900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1225,'VVS1','G',1.5,1.99,12600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1226,'VVS2','G',1.5,1.99,11400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1227,'I1','H',1.5,1.99,4300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1228,'I2','H',1.5,1.99,2900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1229,'I3','H',1.5,1.99,1500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1230,'IF','H',1.5,1.99,10800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1231,'SI1','H',1.5,1.99,6900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1232,'SI2','H',1.5,1.99,5700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1233,'SI3','H',1.5,1.99,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1234,'VS1','H',1.5,1.99,8100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1235,'VS2','H',1.5,1.99,7400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1236,'VVS1','H',1.5,1.99,10000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1237,'VVS2','H',1.5,1.99,9100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1238,'I1','D',2,2.99,8000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1239,'I2','D',2,2.99,4100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1240,'I3','D',2,2.99,1900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1241,'IF','D',2,2.99,33000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1242,'SI1','D',2,2.99,14100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1243,'SI2','D',2,2.99,11300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1244,'SI3','D',2,2.99,9500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1245,'VS1','D',2,2.99,20500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1246,'VS2','D',2,2.99,17500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1247,'VVS1','D',2,2.99,27500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1248,'VVS2','D',2,2.99,23500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1249,'I1','E',2,2.99,7600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1250,'I2','E',2,2.99,3900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1251,'I3','E',2,2.99,1800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1252,'IF','E',2,2.99,27000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1253,'SI1','E',2,2.99,13200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1254,'SI2','E',2,2.99,10500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1255,'SI3','E',2,2.99,8800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1256,'VS1','E',2,2.99,19000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1257,'VS2','E',2,2.99,16000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1258,'VVS1','E',2,2.99,24500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1259,'VVS2','E',2,2.99,21000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1260,'I1','F',2,2.99,7200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1261,'I2','F',2,2.99,3700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1262,'I3','F',2,2.99,1700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1263,'IF','F',2,2.99,24500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1264,'SI1','F',2,2.99,12300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1265,'SI2','F',2,2.99,9800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1266,'SI3','F',2,2.99,8300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1267,'VS1','F',2,2.99,17500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1268,'VS2','F',2,2.99,15000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1269,'VVS1','F',2,2.99,22000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1270,'VVS2','F',2,2.99,19500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1271,'I1','G',2,2.99,6800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1272,'I2','G',2,2.99,3500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1273,'I3','G',2,2.99,1600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1274,'IF','G',2,2.99,20500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1275,'SI1','G',2,2.99,11200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1276,'SI2','G',2,2.99,9200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1277,'SI3','G',2,2.99,7700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1278,'VS1','G',2,2.99,15000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1279,'VS2','G',2,2.99,13500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1280,'VVS1','G',2,2.99,18500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1281,'VVS2','G',2,2.99,16500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1282,'I1','H',2,2.99,6500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1283,'I2','H',2,2.99,3300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1284,'I3','H',2,2.99,1500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1285,'IF','H',2,2.99,16500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1286,'SI1','H',2,2.99,10400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1287,'SI2','H',2,2.99,8600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1288,'SI3','H',2,2.99,7100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1289,'VS1','H',2,2.99,12500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1290,'VS2','H',2,2.99,11500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1291,'VVS1','H',2,2.99,15000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1292,'VVS2','H',2,2.99,13500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1293,'I1','D',3,3.99,10300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1294,'I2','D',3,3.99,4900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1295,'I3','D',3,3.99,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1296,'IF','D',3,3.99,55000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1297,'SI1','D',3,3.99,23500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1298,'SI2','D',3,3.99,20000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1299,'SI3','D',3,3.99,13900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1300,'VS1','D',3,3.99,35000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1301,'VS2','D',3,3.99,29500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1302,'VVS1','D',3,3.99,46000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1303,'VVS2','D',3,3.99,41000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1304,'I1','E',3,3.99,9800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1305,'I2','E',3,3.99,4700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1306,'I3','E',3,3.99,2000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1307,'IF','E',3,3.99,45000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1308,'SI1','E',3,3.99,21000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1309,'SI2','E',3,3.99,18500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1310,'SI3','E',3,3.99,13100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1311,'VS1','E',3,3.99,32000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1312,'VS2','E',3,3.99,26500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1313,'VVS1','E',3,3.99,42000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1314,'VVS2','E',3,3.99,37000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1315,'I1','F',3,3.99,9300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1316,'I2','F',3,3.99,4500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1317,'I3','F',3,3.99,1900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1318,'IF','F',3,3.99,40500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1319,'SI1','F',3,3.99,19500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1320,'SI2','F',3,3.99,17000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1321,'SI3','F',3,3.99,12400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1322,'VS1','F',3,3.99,29500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1323,'VS2','F',3,3.99,24500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1324,'VVS1','F',3,3.99,37500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1325,'VVS2','F',3,3.99,33500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1326,'I1','G',3,3.99,8700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1327,'I2','G',3,3.99,4300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1328,'I3','G',3,3.99,1800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1329,'IF','G',3,3.99,33500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1330,'SI1','G',3,3.99,18000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1331,'SI2','G',3,3.99,15500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1332,'SI3','G',3,3.99,11200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1333,'VS1','G',3,3.99,24500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1334,'VS2','G',3,3.99,21000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1335,'VVS1','G',3,3.99,31500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1336,'VVS2','G',3,3.99,28000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1337,'I1','H',3,3.99,8200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1338,'I2','H',3,3.99,4100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1339,'I3','H',3,3.99,1700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1340,'IF','H',3,3.99,27000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1341,'SI1','H',3,3.99,16000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1342,'SI2','H',3,3.99,13500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1343,'SI3','H',3,3.99,10100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1344,'VS1','H',3,3.99,20500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1345,'VS2','H',3,3.99,18500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1346,'VVS1','H',3,3.99,25000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1347,'VVS2','H',3,3.99,22500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1348,'I1','D',4,4.99,11100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1349,'I2','D',4,4.99,5400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1350,'I3','D',4,4.99,2300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1351,'IF','D',4,4.99,74500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1352,'SI1','D',4,4.99,31500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1353,'SI2','D',4,4.99,25500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1354,'SI3','D',4,4.99,15500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1355,'VS1','D',4,4.99,49500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1356,'VS2','D',4,4.99,41500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1357,'VVS1','D',4,4.99,64500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1358,'VVS2','D',4,4.99,58500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1359,'I1','E',4,4.99,10600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1360,'I2','E',4,4.99,5200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1361,'I3','E',4,4.99,2200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1362,'IF','E',4,4.99,62500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1363,'SI1','E',4,4.99,29500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1364,'SI2','E',4,4.99,24000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1365,'SI3','E',4,4.99,14500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1366,'VS1','E',4,4.99,45000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1367,'VS2','E',4,4.99,39000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1368,'VVS1','E',4,4.99,58500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1369,'VVS2','E',4,4.99,52500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1370,'I1','F',4,4.99,10100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1371,'I2','F',4,4.99,5000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1372,'I3','F',4,4.99,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1373,'IF','F',4,4.99,56500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1374,'SI1','F',4,4.99,27500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1375,'SI2','F',4,4.99,22500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1376,'SI3','F',4,4.99,13800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1377,'VS1','F',4,4.99,41000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1378,'VS2','F',4,4.99,35500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1379,'VVS1','F',4,4.99,52000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1380,'VVS2','F',4,4.99,47500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1381,'I1','G',4,4.99,9500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1382,'I2','G',4,4.99,4700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1383,'I3','G',4,4.99,2000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1384,'IF','G',4,4.99,46500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1385,'SI1','G',4,4.99,24500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1386,'SI2','G',4,4.99,20000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1387,'SI3','G',4,4.99,12700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1388,'VS1','G',4,4.99,36000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1389,'VS2','G',4,4.99,31500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1390,'VVS1','G',4,4.99,43000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1391,'VVS2','G',4,4.99,39500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1392,'I1','H',4,4.99,9000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1393,'I2','H',4,4.99,4400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1394,'I3','H',4,4.99,1900,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1395,'IF','H',4,4.99,36000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1396,'SI1','H',4,4.99,21500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1397,'SI2','H',4,4.99,18000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1398,'SI3','H',4,4.99,11400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1399,'VS1','H',4,4.99,29500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1400,'VS2','H',4,4.99,26000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1401,'VVS1','H',4,4.99,33500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1402,'VVS2','H',4,4.99,31500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1403,'I1','D',5,5.99,12500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1404,'I2','D',5,5.99,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1405,'I3','D',5,5.99,2500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1406,'IF','D',5,5.99,100000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1407,'SI1','D',5,5.99,43000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1408,'SI2','D',5,5.99,31500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1409,'SI3','D',5,5.99,17500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1410,'VS1','D',5,5.99,69000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1411,'VS2','D',5,5.99,58000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1412,'VVS1','D',5,5.99,85500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1413,'VVS2','D',5,5.99,77000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1414,'I1','E',5,5.99,12000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1415,'I2','E',5,5.99,5700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1416,'I3','E',5,5.99,2300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1417,'IF','E',5,5.99,83500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1418,'SI1','E',5,5.99,39500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1419,'SI2','E',5,5.99,29500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1420,'SI3','E',5,5.99,17000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1421,'VS1','E',5,5.99,59500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1422,'VS2','E',5,5.99,52000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1423,'VVS1','E',5,5.99,75000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1424,'VVS2','E',5,5.99,67000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1425,'I1','F',5,5.99,11500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1426,'I2','F',5,5.99,5400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1427,'I3','F',5,5.99,2200,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1428,'IF','F',5,5.99,73000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1429,'SI1','F',5,5.99,36000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1430,'SI2','F',5,5.99,28000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1431,'SI3','F',5,5.99,16000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1432,'VS1','F',5,5.99,54000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1433,'VS2','F',5,5.99,46500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1434,'VVS1','F',5,5.99,67000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1435,'VVS2','F',5,5.99,59500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1436,'I1','G',5,5.99,11000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1437,'I2','G',5,5.99,5100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1438,'I3','G',5,5.99,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1439,'IF','G',5,5.99,60500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1440,'SI1','G',5,5.99,32000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1441,'SI2','G',5,5.99,26000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1442,'SI3','G',5,5.99,15000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1443,'VS1','G',5,5.99,46000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1444,'VS2','G',5,5.99,39500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1445,'VVS1','G',5,5.99,55500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1446,'VVS2','G',5,5.99,50500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1447,'I1','H',5,5.99,10000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1448,'I2','H',5,5.99,4800,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1449,'I3','H',5,5.99,2100,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1450,'IF','H',5,5.99,48000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1451,'SI1','H',5,5.99,26500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1452,'SI2','H',5,5.99,22500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1453,'SI3','H',5,5.99,14000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1454,'VS1','H',5,5.99,36000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1455,'VS2','H',5,5.99,32500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1456,'VVS1','H',5,5.99,44500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1457,'VVS2','H',5,5.99,40000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1458,'I1','D',10,10.99,14000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1459,'I2','D',10,10.99,6600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1460,'I3','D',10,10.99,2700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1461,'IF','D',10,10.99,140000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1462,'SI1','D',10,10.99,63500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1463,'SI2','D',10,10.99,46500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1464,'SI3','D',10,10.99,25000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1465,'VS1','D',10,10.99,107000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1466,'VS2','D',10,10.99,90000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1467,'VVS1','D',10,10.99,130000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1468,'VVS2','D',10,10.99,120000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1469,'I1','E',10,10.99,13500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1470,'I2','E',10,10.99,6300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1471,'I3','E',10,10.99,2600,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1472,'IF','E',10,10.99,127000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1473,'SI1','E',10,10.99,58500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1474,'SI2','E',10,10.99,43000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1475,'SI3','E',10,10.99,23500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1476,'VS1','E',10,10.99,93000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1477,'VS2','E',10,10.99,82000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1478,'VVS1','E',10,10.99,116000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1479,'VVS2','E',10,10.99,103000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1480,'I1','F',10,10.99,13000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1481,'I2','F',10,10.99,6000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1482,'I3','F',10,10.99,2500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1483,'IF','F',10,10.99,111000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1484,'SI1','F',10,10.99,53500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1485,'SI2','F',10,10.99,40000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1486,'SI3','F',10,10.99,22000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1487,'VS1','F',10,10.99,83500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1488,'VS2','F',10,10.99,71500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1489,'VVS1','F',10,10.99,104000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1490,'VVS2','F',10,10.99,93000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1491,'I1','G',10,10.99,12500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1492,'I2','G',10,10.99,5700,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1493,'I3','G',10,10.99,2400,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1494,'IF','G',10,10.99,93000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1495,'SI1','G',10,10.99,48500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1496,'SI2','G',10,10.99,37000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1497,'SI3','G',10,10.99,20500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1498,'VS1','G',10,10.99,71500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1499,'VS2','G',10,10.99,61000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1500,'VVS1','G',10,10.99,86500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1501,'VVS2','G',10,10.99,78500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1502,'I1','H',10,10.99,12000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1503,'I2','H',10,10.99,5500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1504,'I3','H',10,10.99,2300,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1505,'IF','H',10,10.99,75000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1506,'SI1','H',10,10.99,40500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1507,'SI2','H',10,10.99,32500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1508,'SI3','H',10,10.99,18500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1509,'VS1','H',10,10.99,56500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1510,'VS2','H',10,10.99,50000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1511,'VVS1','H',10,10.99,69500,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
INSERT INTO "diamond_price_chart" VALUES(1512,'VVS2','H',10,10.99,63000,'Rapaport 03/21/25 Rounds (extracted table, hundreds US$/ct converted to US$/ct).');
CREATE TABLE diamond_clarity_groups (
  group_key TEXT NOT NULL,
  clarity TEXT NOT NULL,
  PRIMARY KEY (group_key, clarity)
);
INSERT INTO "diamond_clarity_groups" VALUES('IF','IF-VVS');
INSERT INTO "diamond_clarity_groups" VALUES('VVS1','IF-VVS');
INSERT INTO "diamond_clarity_groups" VALUES('VVS2','IF-VVS');
INSERT INTO "diamond_clarity_groups" VALUES('VS1','VS');
INSERT INTO "diamond_clarity_groups" VALUES('VS2','VS');
INSERT INTO "diamond_clarity_groups" VALUES('VS3','VS');
INSERT INTO "diamond_clarity_groups" VALUES('SI1','SI');
INSERT INTO "diamond_clarity_groups" VALUES('SI2','SI');
INSERT INTO "diamond_clarity_groups" VALUES('SI3','SI');
INSERT INTO "diamond_clarity_groups" VALUES('I1','I');
INSERT INTO "diamond_clarity_groups" VALUES('I2','I');
INSERT INTO "diamond_clarity_groups" VALUES('I3','I');
CREATE TABLE orders (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  price TEXT,
  timeline TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  product_name TEXT,
  product_url TEXT,
  design_code TEXT,
  metal TEXT,
  stone TEXT,
  stone_weight TEXT,
  size TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  origin TEXT,
  ip TEXT,
  user_agent TEXT,
  metal_weight TEXT,
  metal_weight_adjustment TEXT,
  timeline_adjustment_weeks TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);
INSERT INTO "orders" VALUES('D3CVFG','2026-01-17T13:21:55.305Z','PENDING_CONFIRMATION','2026-01-17T13:43:19.488Z',replace('Status updated to PENDING_CONFIRMATION. Status email pending.\n\nStatus email sent: PENDING_CONFIRMATION (attempt 1/3) on 2026-01-17T13:43:21.260Z.\n\nCustomer confirmed update on 2026-01-17T13:53:38.022Z.','\n',char(10)),'null','2999','Standard','Art Manasiya','artmanasiya@yahoo.com','5124125580','order','Solitaire Diamond Pendant','https://heerawalla.com/product/solitaire-pendant','Signature','18K White Gold','Lab Grown Diamond','0','null','6402 Clear creek road','6402 Clear creek road','Killeen','Texas','76549','United States','null','null','null','null','null','https://www.heerawalla.com/','https://www.heerawalla.com','99.73.231.32','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0','4','-0.01 or +0.01','null','2026-01-23 02:33:54','null');
INSERT INTO "orders" VALUES('C5TVXU','2026-01-17T14:19:37.815Z','INVOICED','2026-01-17T23:28:14.099Z',replace('Status updated to PENDING_CONFIRMATION on 2026-01-17T21:43:14.855Z. Status email pending.\n\nStatus email sent: PENDING_CONFIRMATION (attempt 1/3) on 2026-01-17T21:43:16.762Z.\n\nCustomer canceled order on 2026-01-17T21:44:53.990Z. Reason: Budget changed.\n\nStatus updated to CANCELLED on 2026-01-17T21:44:53.990Z. Status email pending.\n\nStatus email sent: CANCELLED (attempt 1/3) on 2026-01-17T21:45:42.280Z.\n\nCustomer confirmed update on 2026-01-17T23:28:11.116Z. Payment link: https://www.heerawalla.com/pay?requestId=C5TVXU&token=6c722005c01d4778b5ac5bff6dc0da52.\n\nStatus email sent: INVOICED (attempt 1/3) on 2026-01-17T23:45:45.329Z.\n\nReminder sent: INVOICED (attempt 2/3) on 2026-01-20T00:00:45.560Z.\n\nReminder sent: INVOICED (attempt 3/3) on 2026-01-22T00:00:47.860Z.','\n',char(10)),'null','2999','Standard','Art Manasiya','artmanasiya@yahoo.com','5124125580','order','Solitaire Diamond Pendant','https://heerawalla.com/product/solitaire-pendant','Signature','18K White Gold','Lab Grown Diamond','1.5','null','6402 Clear creek road','6402 Clear creek road','Killeen','Texas','76549','United States','null','null','null','null','null','https://www.heerawalla.com/','https://www.heerawalla.com','99.73.231.32','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0','2.5','0.01 or -0.01','null','2026-01-23 02:33:54','null');
INSERT INTO "orders" VALUES('5763TE','2026-01-29T03:07:10.180Z','INVOICED','2026-01-29T16:52:38.502Z',replace('Status updated to PENDING_CONFIRMATION on 2026-01-29T16:38:52.700Z. Status email pending.\n\nStatus email sent: PENDING_CONFIRMATION (attempt 1/3) on 2026-01-29T16:45:52.000Z.\n\nCustomer confirmed update on 2026-01-29T16:52:38.160Z. Payment link: https://www.heerawalla.com/pay?requestId=5763TE&token=5b05494701d446c5b102bf56b08aa287.\n\nStatus email sent: INVOICED (attempt 1/3) on 2026-01-29T17:15:51.864Z.','\n',char(10)),'','13121','Standard','Aarif','artmanasiya@yahoo.com','5124125580','order','Solitaire Diamond Pendant','https://heerawalla.com/product/solitaire-pendant','Axis','14K White Gold','Natural diamond','1.5 x 1','16 in','2325 Yaupon Range drive','','Leander','Tx','78641','USA','','','','','','https://www.heerawalla.com/','https://www.heerawalla.com','99.73.231.32','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','2.5','-0.1 or +0.5','','2026-01-29T17:15:52.474Z',NULL);
CREATE TABLE quotes (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  price TEXT,
  timeline TEXT,
  timeline_adjustment_weeks TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  product_name TEXT,
  product_url TEXT,
  design_code TEXT,
  metal TEXT,
  metal_weight TEXT,
  stone TEXT,
  stone_weight TEXT,
  diamond_breakdown TEXT,
  size TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  origin TEXT,
  ip TEXT,
  user_agent TEXT,
  quote_metal_options TEXT,
  quote_option_1_clarity TEXT,
  quote_option_1_color TEXT,
  quote_option_1_price_18k TEXT,
  quote_option_2_clarity TEXT,
  quote_option_2_color TEXT,
  quote_option_2_price_18k TEXT,
  quote_option_3_clarity TEXT,
  quote_option_3_color TEXT,
  quote_option_3_price_18k TEXT,
  quote_discount_type TEXT,
  quote_discount_percent TEXT,
  quote_token TEXT,
  quote_expires_at TEXT,
  quote_sent_at TEXT,
  quote_selected_metal TEXT,
  quote_selected_option TEXT,
  quote_selected_price TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);
INSERT INTO "quotes" VALUES('48445DNJ2PXN','2026-01-20T05:54:00.438Z','ACKNOWLEDGED','2026-01-20T06:00:41.103Z','null','null','null','Standard','null','Aarif','arifmanasiya@outlook.com','5124125580','quote','Spiral Continuum','https://www.heerawalla.com/inspirations/spiral-continuum/bespoke/','null','18K Rose Gold','5.1','Lab diamond','1.6',replace('0.02 x 80\n0.01 x 10','\n',char(10)),'Ring size: 5 | Bracelet size: 5.5 in | Chain size: 20 in','2325 Yaupon Range drive','null','Leander','Tx','78641','USA','null','null','null','null','null','https://www.heerawalla.com/','https://www.heerawalla.com','99.73.231.32','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','18K','VVS','F-G','3827','VS','F-G','3658','SI','F-G','2874','null','null','null','null','null','null','null','null','2026-01-23 02:34:10','null');
INSERT INTO "quotes" VALUES('HQYJADSNRX5H','2026-01-29T03:10:15.342Z','NEW','2026-01-29T03:10:15.342Z','','','','Standard','','Aarif','arifmanasiya@outlook.com','5124125580','quote','Chevron Laurel Collar','https://www.heerawalla.com/inspirations/chevron-laurel-collar/bespoke/','','18K White Gold','','Lab diamond','','','Ring size: 5 | Wrist size: 5.75 in | Chain length: 18 in | Earring preference: Stud','2325 Yaupon Range drive','','Leander','Tx','78641','USA','','','','','','https://www.heerawalla.com/','https://www.heerawalla.com','99.73.231.32','Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1','','','','','','','','','','','','','','','','','','','2026-01-29 03:10:15',NULL);
CREATE TABLE contacts (
  email TEXT PRIMARY KEY,
  created_at TEXT,
  name TEXT,
  phone TEXT,
  source TEXT,
  request_id TEXT,
  contact_preference TEXT,
  interests TEXT,
  page_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  subscription_status TEXT,
  status TEXT,
  status_updated_at TEXT,
  notes TEXT,
  last_error TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);
INSERT INTO "contacts" VALUES('artmanasiya@yahoo.com','2026-01-17T22:36:26.497Z','Art Manasiya','5124125580','order,ticket','EPMQUF','meet','null','https://www.heerawalla.com/','null','null','null','null','null','https://www.heerawalla.com/','null','null','null','null','null','null','subscribed','null','null','null','null','2026-01-29T08:15:53.703Z','cron');
INSERT INTO "contacts" VALUES('lazeenmanasia27@gmail.com','2026-01-18T03:05:50.391Z','Lazeen','','ticket','2VE9KF','null','null','https://www.heerawalla.com/','null','null','null','null','null','https://www.heerawalla.com/','null','null','null','null','null','null','subscribed','null','null','null','null','2026-01-29T08:15:53.703Z','cron');
INSERT INTO "contacts" VALUES('lazeenmanasia@gmail.com','2026-01-20T06:02:23.306Z','Lazeen R Manasia','15552001111','ticket','MKZCMC','null','null','https://www.heerawalla.com/','null','null','null','null','null','https://www.heerawalla.com/','null','null','null','null','null','null','subscribed','null','null','null','null','2026-01-29T08:15:53.703Z','cron');
INSERT INTO "contacts" VALUES('arifmanasiya@outlook.com','2026-01-20T05:54:00.438Z','Aarif','5124125580','quote',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-29T08:15:53.703Z','cron');
INSERT INTO "contacts" VALUES('msaifina@yahoo.com','2026-01-28T05:24:18.589Z','Saifina A Manasiya','5124125405','order',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-01-28T08:15:17.449Z','cron');
CREATE TABLE IF NOT EXISTS "order_details" (
  request_id TEXT PRIMARY KEY REFERENCES orders(request_id) ON DELETE CASCADE,
  created_at TEXT,
  status TEXT,
  payment_url TEXT,
  shipping_method TEXT,
  shipping_carrier TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_status TEXT,
  shipping_notes TEXT,
  shipped_at TEXT,
  delivery_eta TEXT,
  delivered_at TEXT,
  certificates TEXT,
  care_details TEXT,
  warranty_details TEXT,
  service_details TEXT,
  updated_at TEXT,
  updated_by TEXT,
  last_shipping_check_at TEXT
);
INSERT INTO "order_details" VALUES('C5TVXU','2026-01-17T23:28:12.688Z','INVOICED','null','https://www.heerawalla.com/pay?requestId=C5TVXU&token=6c722005c01d4778b5ac5bff6dc0da52','null','null','null','null','null','null','null','null','null','null','null','null','null','2026-01-17T23:28:12.688Z','customer');
INSERT INTO "order_details" VALUES('5763TE','2026-01-29T16:50:54.032Z','INVOICED','https://www.heerawalla.com/pay?requestId=5763TE&token=5b05494701d446c5b102bf56b08aa287','Express','FedEx','45467797','https://www.fedex.com/apps/fedextrack/?tracknumbers=45467797','Label created','Signature Required, Insured Delivery',NULL,'2026-02-13',NULL,'IGI: 45678','Wipe gently only with white cloth provided in the packaging. Do not wear while bathing, swimming or playing sports.',NULL,NULL,'2026-01-29T16:52:38.406Z','customer',NULL);
CREATE TABLE tickets (
  request_id TEXT PRIMARY KEY,
  created_at TEXT,
  status TEXT,
  subject TEXT,
  summary TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  page_url TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);
INSERT INTO "tickets" VALUES('HPHGGB','2026-01-17T21:35:17.239Z','NEW',NULL,NULL,'Art Manasiya','artmanasiya@yahoo.com','15124125580','contact','https://www.heerawalla.com/','2026-01-17T21:35:17.239Z','import');
INSERT INTO "tickets" VALUES('EPMQUF','2026-01-17T22:36:26.497Z','NEW','meet',NULL,'Art Manasiya','artmanasiya@yahoo.com','5124125580','concierge','https://www.heerawalla.com/','2026-01-17T22:36:26.497Z','import');
INSERT INTO "tickets" VALUES('2VE9KF','2026-01-18T03:05:50.391Z','NEW',NULL,NULL,'Lazeen','lazeenmanasia27@gmail.com',NULL,'contact','https://www.heerawalla.com/','2026-01-18T03:05:50.391Z','import');
INSERT INTO "tickets" VALUES('MKZCMC','2026-01-20T06:02:23.306Z','NEW',NULL,NULL,'Lazeen R Manasia','lazeenmanasia@gmail.com','15552001111','contact','https://www.heerawalla.com/','2026-01-20T06:02:23.306Z','import');
CREATE TABLE ticket_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_id TEXT NOT NULL REFERENCES tickets(request_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  kind TEXT,
  note TEXT,
  updated_by TEXT
);
CREATE TABLE IF NOT EXISTS "catalog_notes" (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL,
  catalog_slug TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('takeaway', 'translation_note', 'description', 'long_desc')),
  note TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (catalog_id) REFERENCES catalog_items(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "catalog_items" (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('product', 'inspiration')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  categories TEXT,
  gender TEXT,
  styles TEXT,
  motifs TEXT,
  metals TEXT,
  stone_types TEXT,
  design_code TEXT,
  cut TEXT,
  clarity TEXT,
  color TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_by TEXT
);
INSERT INTO "catalog_items" VALUES('hw-001','product','Signature - Legacy','legacy-band','["ring"]','male','["Continuum"]','["Gift"]','["14K Yellow Gold","18K Yellow Gold"]','["Natural Diamond","Lab Grown Diamond"]','Eclipse','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["ring"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hms-001','product','Axis - Apex','hms-001','["sets"]','male','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hms-002','product','Signature - Sovereign','hms-002','["set"]','male','[]','["Gift"]','["18K Yellow Gold","14K Yellow Gold"]','["Natural Diamond","Lab Grown Diamond"]','Signature','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","SI1","SI2","SI3"]','["D","E","F","G","H"]',1,1,'["ring","pendant"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hw-003','product','Solitaire Diamond Pendant','solitaire-pendant','["pendants"]','female','["Solitaire"]','["Wedding/Engagement"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["pendant"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hwp-001','product','Axis Emblem Pendant','axis-emblem-pendant','["pendants"]','unisex','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["pendant","chain"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hwp-002','product','Axis Meridian Pendant','axis-meridian-pendant','["pendants"]','unisex','["Axis"]','["Gift"]','["14K Yellow Gold","14K White Gold","14K Rose Gold","18K Yellow Gold","18K White Gold","18K Rose Gold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["daily","chain"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hw-002','product','Azure Solitaire','azure-solitaire','["rings"]','female','["Solitaire"]','["Wedding","Engagement", "Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Signature','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["diamond"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-001','product','Eclipse - Twist','hws-001','["sets"]','female','["Eclipse"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Eclipse','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-002','product','Continuum - Aurelia Flow','hws-002','["sets"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-003','product','Axis - Poise','hws-003','["sets"]','female','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-004','product','Continuum - Elan Drop','pear-symmetry','["sets"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-005','product','Axis - Equilibria','axis-equilibria','["set"]','female','["Axis"]','["Gift"]','["14K Yellow Gold","14K White Gold","14K Rose Gold","18K Yellow Gold","18K White Gold","18K Rose Gold"]','["Lab Grown Diamond","Natural Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["chain"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-006','product','Continuum - Solitaire','continuum-solitaire','["sets"]','female','["Continuum"]','["Gift"]','["18K White Gold","14K White Gold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","SI1","SI2"]','["D","E","F","G","H","I"]',1,1,'["ring","bracelet","pendant"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-007','product','Continuum - Helix','continuum-helix','["sets"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hws-008','product','Eclipse - Ascende','eclipse-ascende','["sets"]','female','["Eclipse"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Eclipse','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,1,'["design-code"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0008','inspiration','Chevron Laurel Collar','chevron-laurel-collar','["set"]','female','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["chevron","laurel","articulated","refined"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0009','inspiration','Studded Velocity Collar','studded-velocity-collar','["set"]','female','["Eclipse"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Eclipse','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["bold","sculptural","rhythmic","assertive"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0003','inspiration','Spiral Continuum','spiral-continuum','["set"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["spiral","fluid","luminous"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0006','inspiration','Axis Lumina Set','axis-lumina-set','["set"]','female','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["axis","balanced","luminous","feminine"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0005','inspiration','Axis Forge Bracelet','axis-forge-bracelet','["bracelet"]','male','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Axis','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["axis","linear","balanced","masculine"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0004','inspiration','Spiral Reverie Set','spiral-reverie-set','["set"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','Continuum','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["spiral","cascading","sensual"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0007','inspiration','Regal Filigree Cascade','regal-filigree-cascade','["set"]','female','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','null','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["ornate","filigree","ceremonial","luxurious"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0002','inspiration','Luminous Orbit Set','luminous-orbit-set','["set"]','unisex','["Continuum"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','null','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["luminous","circular","elegant"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0001','inspiration','Regal Orbit Cascade','regal-orbit-cascade','["set"]','unisex','["Modern"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','null','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["heirloom-modern","halo-stations","pear-drop","formal"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('insp-0010','inspiration','Convergence Axis Set','convergence-axis-set','["set"]','female','["Axis"]','["Gift"]','["18k Yellow Gold","18K White Gold","14K Yellow Gold","14K WhiteGold"]','["Natural Diamond","Lab Grown Diamond"]','null','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","VS3","SI1","SI2","SI3"]','["D","E","F","G","H","I"]',1,0,'["modern-elegance","crossover-flow","architectural","balanced"]','2026-01-23 02:33:32','2026-01-23 02:33:32','null');
INSERT INTO "catalog_items" VALUES('hwp-004','product','Eclipse - Knot Pendant','eclipse-knot-pendant','["pendant"]','female','["Eclipse"]','["Gift","anniversary","birthday"]','["14K Yellow Gold","14K White Gold","14K Rose Gold","18K Yellow Gold","18K White Gold","18K Rose Gold"]','["Lab Grown Diamond","Natural Diamond"]','Eclipse','["Brilliant"]','["IF","VVS1","VVS2","VS1","VS2","SI1","SI2","SI3","I1","I2","I3"]','["D","E","F","G","H","I"]',1,1,'["chain"]','2026-01-30 01:18:00','2026-01-30 01:18:00',NULL);
CREATE TABLE IF NOT EXISTS "catalog_media" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  position TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);
INSERT INTO "catalog_media" VALUES(683,'hw-001','products_men_bands_hw-001_img-1','',0,0);
INSERT INTO "catalog_media" VALUES(684,'hw-002','products_men_bands_hw-002_img-1','',0,0);
INSERT INTO "catalog_media" VALUES(685,'hms-001','products_men_sets_hms-001_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(686,'hms-001','products_men_sets_hms-001_img-bracelet-2','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(687,'hms-001','products_men_sets_hms-001_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(688,'hms-001','products_men_sets_hms-001_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(689,'hms-001','products_men_sets_hms-001_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(690,'hms-002','products_men_sets_hms-002_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(691,'hms-002','products_men_sets_hms-002_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(692,'hms-002','products_men_sets_hms-002_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(693,'hms-002','products_men_sets_hms-002_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(694,'hwp-001','products_unisex_pendants_hwp-001_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(695,'hwp-001','products_unisex_pendants_hwp-001_img-hero-2','hero',1,0);
INSERT INTO "catalog_media" VALUES(696,'hwp-001','products_unisex_pendants_hwp-001_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(697,'hwp-001','products_unisex_pendants_hwp-001_img-pendant-2','pendant',0,0);
INSERT INTO "catalog_media" VALUES(698,'hwp-001','products_unisex_pendants_hwp-001_img-pendant-3','pendant',0,0);
INSERT INTO "catalog_media" VALUES(699,'hwp-002','products_unisex_pendants_hwp-002_img-hero-03','',0,0);
INSERT INTO "catalog_media" VALUES(700,'hwp-002','products_unisex_pendants_hwp-002_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(701,'hwp-002','products_unisex_pendants_hwp-002_img-hero-2','',0,0);
INSERT INTO "catalog_media" VALUES(702,'hwp-002','products_unisex_pendants_hwp-002_img-pendant-02','pendant',0,0);
INSERT INTO "catalog_media" VALUES(703,'hwp-002','products_unisex_pendants_hwp-002_img-pendant-03','pendant',0,0);
INSERT INTO "catalog_media" VALUES(704,'hw-003','products_women_pendants_hw-003_img-1','',0,0);
INSERT INTO "catalog_media" VALUES(705,'hw-003','products_women_pendants_hw-003_img-2','',0,0);
INSERT INTO "catalog_media" VALUES(706,'hw-003','products_women_pendants_hw-003_img-3','',0,0);
INSERT INTO "catalog_media" VALUES(707,'hw-003','products_women_pendants_hw-003_img-4','',0,0);
INSERT INTO "catalog_media" VALUES(708,'hw-003','products_women_pendants_hw-003_img-5','',0,0);
INSERT INTO "catalog_media" VALUES(709,'hw-002','products_women_rings_hw-002_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(710,'hw-002','products_women_rings_hw-002_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(711,'hws-001','products_women_sets_hws-001_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(712,'hws-001','products_women_sets_hws-001_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(713,'hws-001','products_women_sets_hws-001_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(714,'hws-001','products_women_sets_hws-001_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(715,'hws-002','products_women_sets_hws-002_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(716,'hws-002','products_women_sets_hws-002_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(717,'hws-002','products_women_sets_hws-002_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(718,'hws-002','products_women_sets_hws-002_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(719,'hws-003','products_women_sets_hws-003_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(720,'hws-003','products_women_sets_hws-003_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(721,'hws-003','products_women_sets_hws-003_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(722,'hws-003','products_women_sets_hws-003_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(723,'hws-004','products_women_sets_hws-004_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(724,'hws-004','products_women_sets_hws-004_img-composition-1','',0,0);
INSERT INTO "catalog_media" VALUES(725,'hws-004','products_women_sets_hws-004_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(726,'hws-004','products_women_sets_hws-004_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(727,'hws-004','products_women_sets_hws-004_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(728,'hws-004','products_women_sets_hws-004_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(734,'hws-006','products_women_sets_hws-006_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(735,'hws-006','products_women_sets_hws-006_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(736,'hws-006','products_women_sets_hws-006_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(737,'hws-006','products_women_sets_hws-006_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(738,'hws-006','products_women_sets_hws-006_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(739,'hws-007','products_women_sets_hws-007_img-bracelet-1','bracelet',0,0);
INSERT INTO "catalog_media" VALUES(740,'hws-007','products_women_sets_hws-007_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(741,'hws-007','products_women_sets_hws-007_img-engraving-1','',0,0);
INSERT INTO "catalog_media" VALUES(742,'hws-007','products_women_sets_hws-007_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(743,'hws-007','products_women_sets_hws-007_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(744,'hws-007','products_women_sets_hws-007_img-ring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(745,'hws-008','products_women_sets_hws-008_img-earring-1','ring',0,0);
INSERT INTO "catalog_media" VALUES(746,'hws-008','products_women_sets_hws-008_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(747,'hws-008','products_women_sets_hws-008_img-pendant-1','pendant',0,0);
INSERT INTO "catalog_media" VALUES(748,'insp-0001','inspirations_insp-0001','hero',1,0);
INSERT INTO "catalog_media" VALUES(749,'insp-0002','inspirations_insp-0002','hero',1,0);
INSERT INTO "catalog_media" VALUES(750,'insp-0003','inspirations_insp-0003','hero',1,0);
INSERT INTO "catalog_media" VALUES(751,'insp-0004','inspirations_insp-0004','hero',1,0);
INSERT INTO "catalog_media" VALUES(752,'insp-0005','inspirations_insp-0005','hero',1,0);
INSERT INTO "catalog_media" VALUES(753,'insp-0006','inspirations_insp-0006','hero',1,0);
INSERT INTO "catalog_media" VALUES(754,'insp-0007','inspirations_insp-0007','hero',1,0);
INSERT INTO "catalog_media" VALUES(755,'insp-0008','inspirations_insp-0008','hero',1,0);
INSERT INTO "catalog_media" VALUES(756,'insp-0009','inspirations_insp-0009','hero',1,0);
INSERT INTO "catalog_media" VALUES(757,'insp-0010','inspirations_insp-0010','hero',1,0);
INSERT INTO "catalog_media" VALUES(758,'hws-005','products_women_sets_hws-005_img-bracelet-1','bracelet',0,2);
INSERT INTO "catalog_media" VALUES(759,'hws-005','products_women_sets_hws-005_img-earring-1','',0,3);
INSERT INTO "catalog_media" VALUES(760,'hws-005','products_women_sets_hws-005_img-hero-1','hero',1,0);
INSERT INTO "catalog_media" VALUES(761,'hws-005','products_women_sets_hws-005_img-pendant-1','gallery',0,1);
INSERT INTO "catalog_media" VALUES(762,'hws-005','products_women_sets_hws-005_img-ring-1','ring',0,4);
INSERT INTO "catalog_media" VALUES(763,'hwp-004','hero-1-ml070plm','',0,1);
INSERT INTO "catalog_media" VALUES(764,'hwp-004','rose-ml0776vo','',0,2);
INSERT INTO "catalog_media" VALUES(765,'hwp-004','white-ml07a6nx','hero',1,3);
INSERT INTO "catalog_media" VALUES(766,'hwp-004','white-ml07bpsr','gallery',0,4);
INSERT INTO "catalog_media" VALUES(767,'hwp-004','yellow-ml07elso','gallery',0,5);
INSERT INTO "catalog_media" VALUES(768,'hwp-004','rose-ml07g3im','gallery',0,6);
CREATE TABLE IF NOT EXISTS "catalog_stone_options" (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  role TEXT,
  carat REAL,
  count INTEGER,
  is_primary INTEGER NOT NULL DEFAULT 0,
  size_type TEXT,
  created_at TEXT,
  updated_at TEXT
, "shape" TEXT);
INSERT INTO "catalog_stone_options" VALUES('stoneopt_031f70ae0384f811','hw-003','center',1,1,1,'small','2026-01-23 02:33:32','2026-01-25T20:51:26.621Z','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_2b3ce2d024adc720','hwp-001','Accent',0.02,15,1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_20b5910cdc1b7c75','hw-002','Accent',1,1,1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_dd5c97b7982f2a69','hw-003','center',1.5,1,'','medium','2026-01-23 02:33:32','2026-01-25T20:51:29.287Z','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_75ec99b841ae8bbd','hwp-001','Accent',0.03,15,0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_a5b72ffbcb2bb6ac','hw-003','center',2,1,'','large','2026-01-23 02:33:32','2026-01-25T20:51:33.211Z','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_53feab19c21889b5','hw-003','accent',2.5,1,'','xlarge','2026-01-23 02:33:32','2026-01-25T20:51:36.834Z','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_13bb27c21aa769d6','hw-003','center',3,1,'','xxlarge','2026-01-23 02:33:32','2026-01-25T20:51:40.713Z','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_99bec7618dab7e43','hwp-001','Accent',0.15,1,1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32','round');
INSERT INTO "catalog_stone_options" VALUES('stoneopt_965a4decd14c7140','hwp-001','Accent',0.2,1,0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32','round');
INSERT INTO "catalog_stone_options" VALUES('578b95f4-c187-4807-9736-c5b34c1efc89','hws-005','center',2,4,1,'Medium','2026-01-24T18:44:06.821Z','2026-01-24T21:11:33.183Z','pear');
INSERT INTO "catalog_stone_options" VALUES('8210c7d7-ef0f-4752-9ae7-27cdfed3bd55','hws-005','accent',0.05,88,'','Medium','2026-01-24T18:44:30.191Z','2026-01-24T21:00:19.564Z','round');
INSERT INTO "catalog_stone_options" VALUES('d0657218-d873-4fd4-af65-417d31b3b69f','hws-005','center',0.1,36,0,'Medium','2026-01-24T21:01:12.689Z','2026-01-24T21:01:12.689Z','pear');
INSERT INTO "catalog_stone_options" VALUES('d50a245e-c802-449b-9501-b69f4a6bbc17','hwp-002','accent',0.03,12,1,'small','2026-01-25T05:03:44.788Z','2026-01-25T05:04:10.346Z','round');
INSERT INTO "catalog_stone_options" VALUES('2a41c8a8-7a10-479d-8a19-a9c6842378ff','hwp-002','accent',0.05,12,0,'medium','2026-01-25T05:04:24.813Z','2026-01-25T05:04:24.813Z','round');
INSERT INTO "catalog_stone_options" VALUES('65c64b01-6308-4f7c-a1a9-2042f610d637','hwp-002','accent',0.07,12,0,'large','2026-01-25T05:04:50.125Z','2026-01-25T05:04:50.125Z','round');
INSERT INTO "catalog_stone_options" VALUES('487d58e8-fab6-4a52-a9f1-defa3280a637','hw-001','accent',0.02,22,'','small','2026-01-25T07:12:59.371Z','2026-01-25T18:27:53.787Z','round');
INSERT INTO "catalog_stone_options" VALUES('4601dc0c-915d-4d6f-b788-bd788719d587','hw-001','accent',0.03,18,'','medium','2026-01-25T07:13:28.180Z','2026-01-25T18:25:25.913Z','round');
INSERT INTO "catalog_stone_options" VALUES('e004fe02-c617-47ca-9863-01adac0beab7','hw-001','accent',0.05,15,'','large','2026-01-25T07:41:25.528Z','2026-01-25T18:27:47.411Z','round');
INSERT INTO "catalog_stone_options" VALUES('e0cfe686-fef4-45b6-ab04-7ebfc4a5786d','hw-003','center',0.5,1,1,'xsmall','2026-01-25T20:47:40.122Z','2026-01-25T20:47:40.122Z','round');
INSERT INTO "catalog_stone_options" VALUES('6528bd98-b47f-4a27-ab46-329024fd915f','hws-006','center',0.5,4,1,'xsmall','2026-01-26T07:32:55.245Z','2026-01-26T07:35:40.396Z','round');
INSERT INTO "catalog_stone_options" VALUES('d156f5f3-63cd-4b11-9ab6-d0054bf0ec59','hws-006','center',0.2,25,1,'xsmall','2026-01-26T07:33:29.808Z','2026-01-26T07:35:45.574Z','round');
INSERT INTO "catalog_stone_options" VALUES('3c35fd13-54f2-4b82-adda-7b04cc2d27b5','hws-006','center',1,4,'','small','2026-01-26T07:34:13.107Z','2026-01-26T07:35:38.255Z','round');
INSERT INTO "catalog_stone_options" VALUES('ae24817c-f7ff-433b-b6ba-cab300bcefe2','hws-006','center',0.2,25,'','small','2026-01-26T07:34:51.728Z','2026-01-26T07:35:43.009Z','round');
INSERT INTO "catalog_stone_options" VALUES('e4d83d79-c82e-4158-91a7-c12424ef94f5','hws-006','center',1.5,4,'','medium','2026-01-26T07:35:12.253Z','2026-01-26T07:36:28.406Z','round');
INSERT INTO "catalog_stone_options" VALUES('380ab2d5-0408-4680-bd93-6d4ada820fb7','hws-006','center',0.2,25,'','medium','2026-01-26T07:35:35.395Z','2026-01-26T07:35:41.640Z','round');
INSERT INTO "catalog_stone_options" VALUES('05beae7c-84d5-47b1-b69b-7254e216254a','hws-006','center',0.2,25,0,'large','2026-01-26T07:36:25.395Z','2026-01-26T07:36:25.395Z','round');
INSERT INTO "catalog_stone_options" VALUES('baa27123-7864-4cf9-8ca8-9d502b29f3be','hws-006','center',2,4,0,'large','2026-01-26T07:36:42.112Z','2026-01-26T07:36:42.112Z','round');
INSERT INTO "catalog_stone_options" VALUES('d13e7130-4d2c-4afc-b57a-f713b69205be','hwp-004','center',0.5,1,1,'xsmall','2026-01-30T01:30:12.248Z','2026-01-30T01:53:58.045Z','round');
INSERT INTO "catalog_stone_options" VALUES('f1338de2-5fc1-4a25-9b91-20c077a28fc9','hwp-004','center',1.5,1,1,'medium','2026-01-30T01:30:48.600Z','2026-01-30T01:53:53.336Z','round');
INSERT INTO "catalog_stone_options" VALUES('2d9b8b2d-f096-4609-bab0-35cd947b3ff8','hwp-004','center',2,1,1,'large','2026-01-30T01:31:07.450Z','2026-01-30T01:53:46.134Z','round');
INSERT INTO "catalog_stone_options" VALUES('3ef96e77-93bd-4638-98f7-e36291484b07','hwp-004','accent',0.01,24,'','xsmall','2026-01-30T01:32:02.100Z','2026-01-30T01:54:17.415Z','round');
INSERT INTO "catalog_stone_options" VALUES('24b9be69-c0dd-4b4d-b50b-f574439f1c48','hwp-004','accent',0.03,24,'','medium','2026-01-30T01:32:39.201Z','2026-01-30T01:54:08.147Z','round');
INSERT INTO "catalog_stone_options" VALUES('c6cd2f9e-9bc7-413e-81df-b015d18444a3','hwp-004','accent',0.04,24,'','large','2026-01-30T01:33:15.107Z','2026-01-30T02:03:32.215Z','round');
INSERT INTO "catalog_stone_options" VALUES('b15e1fc4-1f07-439f-926f-a62d70b97db6','hwp-004','accent',0.02,24,0,'small','2026-01-30T02:34:05.810Z','2026-01-30T02:34:05.810Z',NULL);
INSERT INTO "catalog_stone_options" VALUES('ae82b230-609f-4616-af38-8f5f229fcda6','hwp-004','center',1,1,1,'small','2026-01-30T02:34:23.215Z','2026-01-30T02:35:40.200Z','round');
INSERT INTO "catalog_stone_options" VALUES('9c2a212a-b94e-4139-87b2-889b92b38da3','hms-002','main',0.01,28,1,'xsmall','2026-01-30T04:12:51.916Z','2026-01-30T04:12:56.753Z','round');
INSERT INTO "catalog_stone_options" VALUES('96f7d4a5-6403-46fb-9aff-cd2f187458a0','hms-002','accent',0.01,21,'','xsmall','2026-01-30T04:13:15.300Z','2026-01-30T04:16:26.265Z','round');
INSERT INTO "catalog_stone_options" VALUES('1baa58b3-ff75-45a3-a563-a71820b349c6','hms-002','main',0.02,28,1,'small','2026-01-30T04:13:35.869Z','2026-01-30T04:16:27.362Z','round');
INSERT INTO "catalog_stone_options" VALUES('e8664e4e-a69e-4237-b2e7-5c0a39ecdd0d','hms-002','accent',0.02,18,'','small','2026-01-30T04:14:09.886Z','2026-01-30T04:16:31.770Z','round');
INSERT INTO "catalog_stone_options" VALUES('69a50518-5dbf-4a02-b305-aaf0fa808d49','hms-002','main',0.03,28,1,'medium','2026-01-30T04:15:03.328Z','2026-01-30T04:15:12.454Z','round');
INSERT INTO "catalog_stone_options" VALUES('a9b31d02-c5dc-4bba-b261-95822f266a1b','hms-002','accent',0.03,15,'','medium','2026-01-30T04:15:39.632Z','2026-01-30T04:16:37.717Z','');
CREATE TABLE IF NOT EXISTS "catalog_metal_options" (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  metal_weight TEXT,
  is_primary INTEGER NOT NULL DEFAULT 0,
  size_type TEXT,
  created_at TEXT,
  updated_at TEXT
);
INSERT INTO "catalog_metal_options" VALUES('metalopt_da7cbcb0a7537f93_1','hw-003','2.5','','small','2026-01-23 02:33:32','2026-01-25T20:48:17.436Z');
INSERT INTO "catalog_metal_options" VALUES('metalopt_27e07df22106513c_1','hwp-001','2.5',1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_191f84f108a80f94_1','hw-002','2.5',1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_fb2dea405982d942','insp-0006','3',1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_1d29b7ce914db079_1','insp-0005','2.5',1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_f3c8f9cd3807dfc7_1','insp-0007','2.5',1,'small','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_da7cbcb0a7537f93_2','hw-003','2.75','','medium','2026-01-23 02:33:32','2026-01-25T20:50:44.667Z');
INSERT INTO "catalog_metal_options" VALUES('metalopt_27e07df22106513c_2','hwp-001','3',0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_191f84f108a80f94_2','hw-002','3',0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_1d29b7ce914db079_2','insp-0005','3',0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('metalopt_f3c8f9cd3807dfc7_2','insp-0007','3',0,'medium','2026-01-23 02:33:32','2026-01-23 02:33:32');
INSERT INTO "catalog_metal_options" VALUES('e9ca1b61-6cf5-4f68-a394-a04dc827fe17','hws-005','20',1,'Medium','2026-01-24T18:45:15.630Z','2026-01-25T02:40:10.442Z');
INSERT INTO "catalog_metal_options" VALUES('ef0c7ebc-a562-4f17-9d36-b83a312a733a','hwp-002','10','','small','2026-01-25T05:05:12.367Z','2026-01-25T05:05:46.397Z');
INSERT INTO "catalog_metal_options" VALUES('a11ffd32-848b-43a8-965c-b276d140cbcf','hwp-002','12.5','','medium','2026-01-25T05:05:30.158Z','2026-01-25T05:06:00.640Z');
INSERT INTO "catalog_metal_options" VALUES('8411d027-96da-460d-ae3b-4ffec92fefbc','hwp-002','15',0,'large','2026-01-25T05:06:14.849Z','2026-01-25T05:06:14.849Z');
INSERT INTO "catalog_metal_options" VALUES('210afc39-bae1-436a-a4cd-ac2a5b351b00','hw-001','6',1,'small','2026-01-25T07:42:23.490Z','2026-01-25T19:53:36.493Z');
INSERT INTO "catalog_metal_options" VALUES('d5b0d42a-db5f-40df-8ae2-9e07ce7ac3f7','hw-001','7.5',0,'medium','2026-01-25T07:42:30.797Z','2026-01-25T19:35:31.983Z');
INSERT INTO "catalog_metal_options" VALUES('4fddd9cc-d0eb-46f8-9fcf-6759d6cdb7b3','hw-001','9',0,'large','2026-01-25T07:42:45.727Z','2026-01-25T19:15:14.736Z');
INSERT INTO "catalog_metal_options" VALUES('3f5cd2ef-e7e4-4026-8640-5e8f107c6716','hw-003','2.25',1,'xsmall','2026-01-25T20:48:11.304Z','2026-01-25T20:48:13.849Z');
INSERT INTO "catalog_metal_options" VALUES('4bc2e6ba-1d9c-4cc8-a71d-365cfa415015','hw-003','3.0',0,'large','2026-01-25T20:50:54.625Z','2026-01-25T20:50:54.625Z');
INSERT INTO "catalog_metal_options" VALUES('1521b266-bed9-4349-b043-abe817210548','hw-003','3.25',0,'xlarge','2026-01-25T20:52:03.350Z','2026-01-25T20:52:03.350Z');
INSERT INTO "catalog_metal_options" VALUES('dc2d32a6-9dc3-410e-a840-7be606857ea6','hw-003','3.5',0,'xxlarge','2026-01-25T20:52:20.173Z','2026-01-25T20:52:20.173Z');
INSERT INTO "catalog_metal_options" VALUES('7808cda5-7a56-4a76-8c17-046a8b98a198','hws-006','12',1,'xsmall','2026-01-26T07:37:38.031Z','2026-01-26T07:37:38.031Z');
INSERT INTO "catalog_metal_options" VALUES('141153d4-158e-48ef-b4e6-8a88e05fcf78','hws-006','14',0,'small','2026-01-26T07:38:00.824Z','2026-01-26T07:38:00.824Z');
INSERT INTO "catalog_metal_options" VALUES('62b291ec-d63b-49b8-b5ff-e9e464971ad3','hws-006','15','','medium','2026-01-26T07:38:10.055Z','2026-01-26T07:38:18.898Z');
INSERT INTO "catalog_metal_options" VALUES('1de6f705-c198-425a-8e8b-dd6a1bab86da','hws-006','17',0,'large','2026-01-26T07:38:28.477Z','2026-01-26T07:38:28.477Z');
INSERT INTO "catalog_metal_options" VALUES('74d5fdf9-15e0-44b5-a912-f36572da1e4e','hwp-004','6',1,'X-Small','2026-01-30T01:33:37.607Z','2026-01-30T02:05:16.551Z');
INSERT INTO "catalog_metal_options" VALUES('1c607968-12c9-413f-b75f-7da82f5b7fe0','hwp-004','10',1,'Medium','2026-01-30T01:34:13.439Z','2026-01-30T02:05:27.988Z');
INSERT INTO "catalog_metal_options" VALUES('aa7636c8-e41d-4757-95ee-f5d7d5996502','hwp-004','12',1,'Large','2026-01-30T01:34:32.285Z','2026-01-30T02:05:33.348Z');
INSERT INTO "catalog_metal_options" VALUES('a5a8d82d-a8dc-4288-ae9b-8997fcac5ebd','hwp-004','8',1,'Small','2026-01-30T02:33:42.395Z','2026-01-30T02:35:24.048Z');
INSERT INTO "catalog_metal_options" VALUES('d4fd9d0d-b6ce-44b9-a6a6-81f7a121eea9','hms-002','45',1,'X-Small','2026-01-30T04:17:39.507Z','2026-01-30T04:19:18.465Z');
INSERT INTO "catalog_metal_options" VALUES('81c77ace-471d-46cc-9e72-302eb7e9775d','hms-002','50',1,'Small','2026-01-30T04:18:09.278Z','2026-01-30T04:19:15.193Z');
INSERT INTO "catalog_metal_options" VALUES('593a6c7d-fd18-444d-ac5f-18e5e88b7c5f','hms-002','55',1,'Medium','2026-01-30T04:18:23.427Z','2026-01-30T04:19:10.861Z');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',20);
INSERT INTO "sqlite_sequence" VALUES('cost_chart',182);
INSERT INTO "sqlite_sequence" VALUES('diamond_price_chart',4536);
INSERT INTO "sqlite_sequence" VALUES('ticket_details',0);
INSERT INTO "sqlite_sequence" VALUES('catalog_media',768);
CREATE INDEX idx_diamond_price_chart_lookup
  ON diamond_price_chart (clarity, color, weight_min, weight_max);
CREATE INDEX idx_orders_status ON orders (status, created_at);
CREATE INDEX idx_orders_email ON orders (email);
CREATE INDEX idx_quotes_status ON quotes (status, created_at);
CREATE INDEX idx_quotes_email ON quotes (email);
CREATE INDEX idx_contacts_status ON contacts (status, created_at);
CREATE INDEX idx_tickets_status_created
  ON tickets (status, created_at);
CREATE INDEX idx_tickets_email
  ON tickets (email);
CREATE INDEX idx_ticket_details_request
  ON ticket_details (request_id, created_at);
CREATE INDEX idx_catalog_notes_catalog
  ON catalog_notes (catalog_id, catalog_slug, kind);
CREATE INDEX idx_catalog_items_type_active
  ON catalog_items (type, is_active, is_featured);
CREATE INDEX idx_catalog_media_catalog
  ON catalog_media (catalog_id);
CREATE INDEX idx_catalog_stone_options_catalog
  ON catalog_stone_options (catalog_id);
CREATE INDEX idx_catalog_stone_options_role
  ON catalog_stone_options (role);
CREATE INDEX idx_catalog_metal_options_catalog
  ON catalog_metal_options (catalog_id);
