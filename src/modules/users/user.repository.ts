import { User } from "../../entities/user.entity";
import { 
    EntityRepository, Repository, getRepository 
} from "typeorm";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
    async createAndSave(user: User): Promise<number> {
        let stud = new User();
        stud.name = user.name;
        stud.email = user.email;
        stud.lobbies = user.lobbies;
        stud.password = user.password;
        await this.save(stud);
        return stud.id;
    }

    async allUsers(): Promise<User[]> {
        return await this.find();
    }

    async findOneUser(id: number): Promise<User> {
        return await this.findOne({ 
            where: { id: id }
        });
    }

    async updateUser(id: number, user: User): Promise<number> {
        await this.manager.update(User, id, user);
        return id;
    }

    async deleteUser(user: number | User) {
        await this.manager.delete(User, typeof user === 'number' ? user : user.id);
    }
}