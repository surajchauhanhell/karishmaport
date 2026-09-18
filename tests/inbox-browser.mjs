// UI integration contract test. Responses are deliberately mocked; not a live Supabase test.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const user={id:'00000000-0000-0000-0000-000000000010',email:'admin@example.test',aud:'authenticated',role:'authenticated',created_at:new Date().toISOString(),app_metadata:{},user_metadata:{}};
const token=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')}.fixture`;
const tables={products:[],portfolio_items:[],blog_posts:[],looks:[],look_products:[],creator_settings:[],smart_links:[],testimonials:[],brand_collaborations:[],collaboration_inquiries:[],contact_messages:[],analytics_events:[],affiliate_clicks:[]};
await page.route('https://fixture.supabase.co/**',async route=>{const req=route.request();const u=new URL(req.url());const respond=(body,status=200,extra={})=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*',...extra},body:JSON.stringify(body)});if(req.method()==='OPTIONS')return respond({});if(u.pathname.includes('/auth/v1/token'))return respond({access_token:token,refresh_token:'fixture-refresh-token',expires_in:3600,token_type:'bearer',user});if(u.pathname.includes('/auth/v1/user'))return respond(user);if(u.pathname.endsWith('/rpc/is_admin'))return respond(true);if(u.pathname.endsWith('/rpc/admin_analytics'))return respond({product_clicks:[],campaign_clicks:[],source_clicks:[],product_views:[],brand_enquiries:[]});if(u.pathname.includes('/functions/v1/')){const body=req.postDataJSON();if(body.action==='contact'||body.action==='collaboration'){const table=body.action==='contact'?'contact_messages':'collaboration_inquiries';tables[table].push({...body.values,id:crypto.randomUUID(),status:'new',created_at:new Date().toISOString()});}return respond({ok:true});}if(u.pathname.includes('/storage/v1/object/'))return respond({Key:'fixture.webp'});const table=u.pathname.split('/').at(-1);if(!(table in tables))return respond({});if(req.method()==='HEAD')return route.fulfill({status:200,headers:{'content-range':`0-0/${tables[table].length}`}});if(req.method()==='GET')return respond(tables[table]);if(req.method()==='POST'){const body=req.postDataJSON();const row=Array.isArray(body)?body[0]:body;const id=row.id||crypto.randomUUID();const existing=tables[table].findIndex(x=>x.id===id);const value={...row,id,created_at:new Date().toISOString()};if(existing>=0)tables[table][existing]={...tables[table][existing],...value};else tables[table].push(value);return respond(null,201);}if(req.method()==='DELETE'){tables[table]=tables[table].filter(x=>`eq.${x.id}`!==u.searchParams.get('id'));return respond(null);}return respond({});});

try {
await page.goto('http://127.0.0.1:5174/contact');
await page.getByLabel('Your name',{exact:true}).fill('Test visitor');
await page.getByLabel('Email',{exact:true}).fill('visitor@example.test');
await page.getByLabel('Subject',{exact:true}).fill('Product enquiry');
await page.getByLabel('Your message',{exact:true}).fill('Please share more information about this product.');
await page.getByRole('checkbox').check();
await page.getByRole('button',{name:'Send message',exact:true}).click();
await page.getByText('Message sent. Thank you for reaching out!').waitFor();
assert.equal(tables.contact_messages.length,1);
await page.goto('http://127.0.0.1:5174/work-with-me');
await page.getByLabel('Brand name',{exact:true}).fill('Test brand');
await page.getByLabel('Contact person',{exact:true}).fill('Test partner');
await page.getByLabel('Email',{exact:true}).fill('partner@example.test');
await page.getByLabel('Campaign type',{exact:true}).fill('Beauty reel');
await page.getByLabel('Product / service',{exact:true}).fill('Makeup brushes');
await page.getByLabel('Expected deliverables',{exact:true}).fill('One demonstration reel');
await page.getByLabel('Tell me about your idea',{exact:true}).fill('We would like to discuss a product collaboration.');
await page.getByRole('checkbox').check();
await page.getByRole('button',{name:'Send collaboration enquiry',exact:true}).click();
await page.getByText('Message sent. Thank you for reaching out!').waitFor();
assert.equal(tables.collaboration_inquiries.length,1);
await page.goto('http://127.0.0.1:5174/admin/login');
await page.getByLabel('Email',{exact:true}).fill(user.email);await page.getByLabel('Password').fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/admin');
await page.getByRole('link',{name:'Contact messages',exact:true}).click();
await page.getByRole('cell').filter({hasText:'visitor@example.test'}).waitFor();
await page.getByRole('button',{name:'View message'}).click();
await page.getByText('Please share more information about this product.',{exact:true}).waitFor();
assert.equal(await page.getByRole('button',{name:'Save changes'}).count(),0);
await page.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('button',{name:'Delete record',exact:true}).click();await page.getByText('No contact messages yet.').waitFor();assert.equal(tables.contact_messages.length,0);
await page.getByRole('link',{name:'Work with me enquiries',exact:true}).click();
await page.getByRole('cell').filter({hasText:'partner@example.test'}).waitFor();
await page.getByRole('button',{name:'View message'}).click();
await page.getByText('We would like to discuss a product collaboration.',{exact:true}).waitFor();
assert.deepEqual(errors,[]);
console.log('Mocked form-to-inbox contracts passed for contact and collaboration, including read-only details and deletion.');
} finally {await browser.close();}

