export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

export class UserManager {
    // mapping id (key) to users (value)
    private usersById: Map<string, User> = new Map();

    addUser(user: User): void {
        if (!user.id) {
            throw new Error('User must have an id');
        }
        if (this.usersById.has(user.id)) {
            throw new Error(`User with id ${user.id} already exists`);
        }
        this.usersById.set(user.id, user);
    }

    removeUser(id: string): void {
        if (!this.usersById.has(id)) {
            throw new Error(`User with id ${id} not found`);
        }
        this.usersById.delete(id);
    }

    getUser(id: string): User | null {
        return this.usersById.get(id) ?? null;
    }

    getUsersByEmail(email: string): User[] | null {
        return this.getAllUsers().filter((user) => user.email === email);
    }

    getUsersByPhone(phone: string): User[] | null {
        return this.getAllUsers().filter((user) => user.phone === phone);
    }

    getAllUsers(): User[] {
        return Array.from(this.usersById.values());
    }

    getUserCount(): number {
        return this.usersById.size;
    }
}
