import Group from '#models/group'

export default class GroupService {

  static async getByManagerId(managerId: number) {
    return Group.query()
      .where('group.manager_id', managerId)
      .join('unit', 'unit.id', 'group.unit_id')
      .join('users', 'users.id', 'group.manager_id')
      .select([
        'group.id as group_id',
        'group.name as group_name',
        'unit.id as unit_id',
        'unit.name as unit_name',
        'users.id as manager_id',
        'users.name as manager_name',
      ])
  }

}
