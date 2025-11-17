"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { UserTableSkeleton } from "@/components/ui/table-skeleton"

type UserRole = "ADMIN" | "CONTRIBUTOR" | "USER"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, isActive: boolean) => {
    setUpdatingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user")
      }

      const data = await response.json()

      // Update the user in the list
      setUsers(users.map(u => u.id === userId ? data.user : u))

      toast.success(
        isActive
          ? "User activated successfully"
          : "User deactivated successfully"
      )
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUpdatingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update user role")
      }

      const data = await response.json()

      // Update the user in the list
      setUsers(users.map(u => u.id === userId ? data.user : u))

      toast.success("User role updated successfully")
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update user role")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }

    setUpdatingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete user")
      }

      // Remove the user from the list
      setUsers(users.filter(u => u.id !== userId))

      toast.success("User deleted successfully")
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "destructive"
      case "CONTRIBUTOR":
        return "default"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {loading ? "..." : `${users.length} total users`}
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <UserTableSkeleton rows={5} />
          ) : (
            <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name || "—"}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onChange={(e) =>
                      updateUserRole(user.id, e.target.value as UserRole)
                    }
                    disabled={updatingUserId === user.id}
                    className="w-[140px]"
                  >
                    <option value="USER">User</option>
                    <option value="CONTRIBUTOR">Contributor</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "success" : "secondary"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(user.lastLoginAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 sm:gap-2">
                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserStatus(user.id, false)}
                        disabled={updatingUserId === user.id}
                        className="whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Deactivate</span>
                        <span className="sm:hidden">Deact</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateUserStatus(user.id, true)}
                        disabled={updatingUserId === user.id}
                        className="whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Activate</span>
                        <span className="sm:hidden">Act</span>
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      disabled={updatingUserId === user.id}
                      className="whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Delete</span>
                      <span className="sm:hidden">Del</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
            </Table>
          )}
        </div>

        {!loading && users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </Card>
    </div>
  )
}
