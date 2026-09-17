-- Safe starter data. No invented partnerships, reviews or audience demographics.
insert into public.creator_settings(id,bio,intro,seo_description) values ('00000000-0000-0000-0000-000000000001','I’m a Mumbai-based beauty, fashion and lifestyle creator sharing relatable beauty inspiration, fashion, GRWM, traditional looks and everyday moments. My goal is to create content that helps women feel more confident, inspired and comfortable expressing their personal style.','A Mumbai-based beauty, fashion and lifestyle creator sharing makeup, GRWM, traditional looks, fashion, product discoveries and everyday moments.','Discover Karishma Chauhan, a Mumbai-based beauty, fashion and lifestyle creator sharing makeup, GRWM, traditional looks, fashion inspiration and everyday content.') on conflict(id) do nothing;
insert into public.blog_posts(title,slug,status) values
 ('5 Easy Marathi Makeup Looks for Wedding Functions','easy-marathi-makeup-looks','draft'),
 ('Best Lipstick Shades for Green Sarees','lipstick-shades-green-sarees','draft'),
 ('Easy Saree Hairstyles for Beginners','easy-saree-hairstyles','draft'),
 ('Mumbai Monsoon Makeup Tips','mumbai-monsoon-makeup-tips','draft'),
 ('How to Create a Maharashtrian Traditional Look','maharashtrian-traditional-look','draft'),
 ('Affordable Makeup Products I Actually Use','affordable-makeup-products','draft'),
 ('Wedding Guest Makeup Ideas for Indian Functions','wedding-guest-makeup','draft'),
 ('Simple GRWM Routine for College Events','college-grwm-routine','draft'),
 ('How to Style Jewellery With Traditional Outfits','traditional-jewellery-styling','draft'),
 ('Beauty Products Worth Trying This Festive Season','festive-beauty-products','draft') on conflict(slug) do nothing;
insert into public.products(name,slug,brand,category,description,is_demo,active,featured) values
 ('Makeup discovery — demo','demo-makeup-discovery','Demo','Makeup','A sample catalogue entry for setup. This is not a product recommendation.',true,false,false),
 ('Traditional accessory — demo','demo-traditional-accessory','Demo','Jewellery','A sample catalogue entry for setup. Replace with a real, verified product.',true,false,false) on conflict(slug) do nothing;
insert into public.smart_links(keyword,title,destination_url) values ('LOOK','Shop my picks','/shop'),('LIPSTICK','Makeup discoveries','/shop?category=Makeup'),('HAIR','Hair discoveries','/shop?category=Hair') on conflict do nothing;
