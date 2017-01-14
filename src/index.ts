import vantage = require('vantage')
import playTutorial from './playTutorial'
import play1v1 from './play1v1'


const cli = vantage()


cli
  .command('tutorial')
  .description('Plays the tutorial')
  .action(playTutorial)

cli
  .command('one-v-one')
  .description('Plays a 1v1 game')
  .action(play1v1)


cli
  .delimiter('dookiebot~$')
  .listen(8010)
  .show()


process.on('unhandledRejection', err => console.error(err))
