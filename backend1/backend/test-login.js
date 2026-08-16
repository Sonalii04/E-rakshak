import bcrypt from 'bcryptjs';

const hash = '$2b$10$39ijM//s/CzPSyimTPYlL.4JRxADS0kwvAF5jwQ9xCPmrf0D7VW7O';

async function test() {
  const match = await bcrypt.compare('demo', hash);
  console.log('Match for "demo":', match);
  const match2 = await bcrypt.compare('admin', hash);
  console.log('Match for "admin":', match2);
  const match3 = await bcrypt.compare('admin_test', hash);
  console.log('Match for "admin_test":', match3);
  const match4 = await bcrypt.compare('r.sharma', hash);
  console.log('Match for "r.sharma":', match4);
}

test();
