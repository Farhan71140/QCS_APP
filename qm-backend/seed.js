require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function seed() {
  console.log('Seeding QM database...');
  const users = [
    { name: 'Admin User',   email: 'admin@workforceos.com',  password: 'Admin@123', role: 'admin',       employee_id: 'EMP-0001' },
    { name: 'Priya Sharma', email: 'priya@workforceos.com',  password: 'Pass@123',  role: 'supervisor',  employee_id: 'EMP-0101' },
    { name: 'Ravi Kumar',   email: 'leader@workforceos.com', password: 'Pass@123',  role: 'teamleader',  employee_id: 'EMP-0102' },
    { name: 'Anita Singh',  email: 'anita@workforceos.com',  password: 'Pass@123',  role: 'participant', employee_id: 'EMP-1001' },
    { name: 'Ramesh Kumar', email: 'ramesh@workforceos.com', password: 'Pass@123',  role: 'participant', employee_id: 'EMP-1023' },
    { name: 'Sunita Rao',   email: 'sunita@workforceos.com', password: 'Pass@123',  role: 'participant', employee_id: 'EMP-1031' }
  ];
  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const { error } = await supabase.from('users').upsert({ ...u, password: hashed }, { onConflict: 'email' });
    if (error) console.error('ERR', u.email, error.message);
    else console.log('OK ', u.email);
  }
  console.log('\nDone! Login: admin@workforceos.com / Admin@123');
  process.exit(0);
}

seed().catch(console.error);
