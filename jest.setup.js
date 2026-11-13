// AsyncStorage es un módulo nativo: en los tests se usa la versión simulada que trae la propia librería.
jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

// Librería nativa de alarmas: en los tests se usa el mock oficial (no hay módulo nativo).
jest.mock("react-native-notify-kit", () => require("react-native-notify-kit/jest-mock"));
