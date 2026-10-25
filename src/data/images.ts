// Free-to-use photos from Unsplash (unsplash.com/license), hot-linked by photo id.
// Swap these for your own CDN uploads when the backend is ready.

export const POOLS = {
  exterior: [
    '1600596542815-ffad4c1539a9', '1600585154340-be6161a56a0c', '1564013799919-ab600027ffc6', '1568605114967-8130f3a36994',
    '1570129477492-45c003edd2be', '1512917774080-9991f1c4c750', '1449844908441-8829872d2607', '1580587771525-78b9dba3b914',
    '1613490493576-7fde63acd811', '1600566753190-17f0baa2a6c3', '1416331108676-a22ccb276e35', '1523217582562-09d0def993a6',
    '1494526585095-c41746248156', '1576941089067-2de3c901e126', '1599809275671-b5942cabc7a2', '1600047509807-ba8f99d2cdde',
    '1605276374104-dee2a0ed3cd6', '1592595896551-12b371d546d5', '1582268611958-ebfd161ef9cf', '1505843513577-22bb7d21e455',
    '1430285561322-7808604715df',
  ],
  building: ['1545324418-cc1a3fa10c00', '1574362848149-11496d93a7c7', '1515263487990-61b07816b324'],
  interior: [
    '1502672260266-1c1ef2d93688', '1522708323590-d24dbb6b0267', '1560448204-e02f11c3d0e2', '1493809842364-78817add7ffb',
    '1505691938895-1758d7feb511', '1586023492125-27b2c045efd7', '1600607687939-ce8a6c25118c', '1600210492486-724fe5c67fb0',
    '1600573472550-8090b5e0745e', '1501183638710-841dd1904471',
  ],
  kitchen: ['1484154218962-a197022b5858', '1556912173-3bb406ef7e77'],
  bedroom: ['1631049307264-da0ec9d70304'],
  land: [
    '1500382017468-9049fed747ef', '1560493676-04071c5f467b', '1444858291040-58f756a3bdd6', '1495107334309-fcf20504a5ab',
    '1500076656116-558758c991c1', '1465146344425-f00d5f5c8f07', '1472214103451-9374bd1c798e',
  ],
  office: ['1497366216548-37526070297c', '1497366811353-6870744d04b2', '1524758631624-e2822e304c36', '1486406146926-c627a92ad1ab'],
  shop: ['1441986300917-64674bd600d8'],
  event: ['1519167758481-83f550bb49b3', '1464366400600-7168b8af9bc3', '1625244724120-1fd1d34d00f6'],
}

/** Resolve a stored image reference (Unsplash id or data/http URL) to a sized URL. */
export function imgUrl(ref: string, width = 600): string {
  if (ref.startsWith('data:') || ref.startsWith('http') || ref.startsWith('blob:')) return ref
  return `https://images.unsplash.com/photo-${ref}?w=${width}&q=70&auto=format&fit=crop`
}

export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#e6f1e2"/><path d="M150 170 200 128l50 42v52h-30v-34h-40v34h-30z" fill="#b6cfae"/></svg>`,
  )
