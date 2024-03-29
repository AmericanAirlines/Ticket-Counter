import { ViewOutput } from '@slack/bolt';
import 'jest';
import { ViewOutputUtils } from '../../../slack/utils/ViewOutputUtils';

describe('view output utils', () => {
  it('gets the correct value for a specified field', () => {
    const mockActionId = 'something';
    const mockValue = 'a selected value';
    const mockViewOutput = {
      state: {
        values: [
          {
            someFakeActionId: 'some fake value',
            [mockActionId]: mockValue,
          },
        ],
      },
    } as unknown as ViewOutput;
    const viewOutputUtils = new ViewOutputUtils(mockViewOutput);
    expect(viewOutputUtils.getInputValue(mockActionId)).toBe(mockValue);
  });
  it('returns undefined when the field cannot be found', () => {
    const mockViewOutput = {
      state: {
        values: [{}],
      },
    } as unknown as ViewOutput;
    const viewOutputUtils = new ViewOutputUtils(mockViewOutput);
    expect(viewOutputUtils.getInputValue('someUnknownActionId')).toBeUndefined();
  });
});
