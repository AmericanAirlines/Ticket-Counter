/**
 * Get the mocked version of a function or class. If the
 * implementation is not a mock, an error will be thrown
 *
 * @param originalImplementation The original function or class
 */
export const getMock = <T extends (...args: any) => any>(
  originalImplementation: T,
): jest.Mock<ReturnType<T>, Parameters<T>> => {
  if (!jest.isMockFunction(originalImplementation)) {
    throw new Error(`${originalImplementation.name} is not a mock function`);
  }

  return originalImplementation as jest.Mock<ReturnType<T>, Parameters<T>>;
};
