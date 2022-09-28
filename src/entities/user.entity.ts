import { Lobby } from './lobby.entity';
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public email: string;

  @Column()
  public name: string;

  @Column()
  public password: string;

  @ManyToMany(type => Lobby, lobby => lobby.users)
  @JoinTable({
    name: "user_lobby",
    joinColumns: [
        {name: 'userId', referencedColumnName: "id"}
    ],
    inverseJoinColumns: [
        {name: 'lobbyId', referencedColumnName: "id"}
    ]
  })
  public lobbies: Lobby[]
}