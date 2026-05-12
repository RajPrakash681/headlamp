/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import MenuList from '@mui/material/MenuList';
import { Meta, StoryFn } from '@storybook/react';
import { getTestDate } from '../../../helpers/testHelpers';
import { TestContext } from '../../../test';
import ScaleMultipleButton, { ScalableResource } from './ScaleMultipleButton';

export default {
  title: 'Resource/ScaleMultipleButton',
  component: ScaleMultipleButton,

  decorators: [
    Story => (
      <TestContext>
        <Story />
      </TestContext>
    ),
  ],
} as Meta;

const Template: StoryFn<typeof ScaleMultipleButton> = args => <ScaleMultipleButton {...args} />;

const mockItems = [
  {
    metadata: {
      uid: '1',
      name: 'deployment-alpha',
      creationTimestamp: getTestDate().toISOString(),
    },
    spec: { replicas: 2 },
  },
  {
    metadata: { uid: '2', name: 'deployment-beta', creationTimestamp: getTestDate().toISOString() },
    spec: { replicas: 3 },
  },
] as ScalableResource[];

export const Default = Template.bind({});
Default.args = {
  items: mockItems,
};

export const AfterConfirmCallback = Template.bind({});
AfterConfirmCallback.args = {
  items: mockItems,
  afterConfirm: () => {
    console.log('afterConfirm callback executed!');
  },
};

export const MenuButtonStyle = Template.bind({});
MenuButtonStyle.args = {
  items: mockItems,
  buttonStyle: 'menu',
};
MenuButtonStyle.decorators = [
  Story => (
    <MenuList>
      <Story />
    </MenuList>
  ),
];

export const SingleItem = Template.bind({});
SingleItem.args = {
  items: [mockItems[0]],
};
