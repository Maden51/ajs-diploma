import Character from '../Character';

test('should throw an error when try to create Character', () => {
  function create() {
    return new Character();
  }
  expect(create).toThrowError('Создание объектов с именем Character запрещено');
});
