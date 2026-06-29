import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'puriva@puriva.id' },
    include: { memberships: { include: { membershipRoles: { include: { role: true } } } } }
  })
  if (!user) { console.log('User not found'); return }
  const membership = user.memberships[0]
  if (!membership) { console.log('No membership'); return }
  console.log('tenantId:', membership.tenantId)
  console.log('current roles:', membership.membershipRoles.map(r => r.role.key))
  let clientRole = await prisma.role.findFirst({ where: { tenantId: membership.tenantId, key: 'client' } })
  if (!clientRole) {
    clientRole = await prisma.role.create({ data: { tenantId: membership.tenantId, key: 'client', name: 'Client', status: 'ACTIVE' } })
    console.log('Created Role client:', clientRole.id)
  } else { console.log('Role client exists:', clientRole.id) }
  const existing = await prisma.membershipRole.findFirst({ where: { tenantMembershipId: membership.id, roleId: clientRole.id } })
  if (!existing) {
    await prisma.membershipRole.create({ data: { tenantMembershipId: membership.id, roleId: clientRole.id } })
    console.log('DONE: client role assigned')
  } else { console.log('Already assigned') }
}
main().catch(console.error).finally(() => prisma.$disconnect())
