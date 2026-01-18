import User from "#models/user";

export default class UserService {

    //Listo dados de um usuário
    static async getUserData(userId: number, fields?: string[]) {
        if (fields && Array.isArray(fields) && fields.length > 0) {
            const user = await User.query().where('id', userId).select(fields).first();
            return user;
        } else {
            const user = await User.findBy('id', userId);
            return user;
        }
    }


}