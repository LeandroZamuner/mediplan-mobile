// AsyncStorage es un módulo nativo: en los tests se usa la versión simulada que trae la propia librería.
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));
