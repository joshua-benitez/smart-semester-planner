import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/get-current-user'
import { UnauthorizedError } from '@/lib/errors'
import { ok, err } from '@/server/responses'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth()
    const { id } = params
    if (!id) return err('Missing id', 400, 'validation_error')

    const assignment = await prisma.assignment.findFirst({
      where: { id, userId: user.id },
      include: { course: true },
    })
    if (!assignment) return err('Not found', 404, 'not_found')
    return ok(assignment)
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return err('Unauthorized', 401, 'unauthorized')
    }
    console.error('Error fetching assignment by id:', err)
    return err('Failed to fetch assignment', 500, 'server_error')
  }
}
