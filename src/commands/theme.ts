import { Command } from 'commander';
import { listCommand } from './theme/list.js';
import { showCommand } from './theme/show.js';
import { setCommand } from './theme/set.js';

export const themeCommand = new Command('theme')
  .description('Manage Web Awesome themes')
  .addCommand(listCommand)
  .addCommand(setCommand)
  .addCommand(showCommand);
