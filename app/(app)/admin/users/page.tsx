import { getAllUsers } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaWhatsapp } from "react-icons/fa";

const roleLabel: Record<string, string> = {
  CLIENTE: "Cliente",
  DEV: "Desarrollador",
  ADMIN: "Admin",
  OWNER: "Owner",
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <main className="flex-1 overflow-y-auto px-4 py-10 pb-24 sm:px-8 sm:py-14 md:pb-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Usuarios
        </h1>

        <Card className="mt-6">
          <CardContent>
            {users.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">Todavía no hay usuarios.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Alta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.fullName ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span>{user.email}</span>
                          {user.phone && (
                            <a
                              href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                            >
                              <FaWhatsapp className="size-3.5" />
                              {user.phone}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleLabel[user.role] ?? user.role}</Badge>
                      </TableCell>
                      <TableCell>{user._count.orders}</TableCell>
                      <TableCell>{user.createdAt.toLocaleDateString("es-AR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
