import bluebird = require('bluebird')
import webdriverio = require('webdriverio')
import scrapeCurrentStateScript from './scrapeCurrentStateScript'
import addCustomStylesScript from './addCustomStylesScript'
import { VisibleGameInformation, Order, Tile } from '../types'
import { botName, generalsIoUrl, webdriverOpts, viewportSize } from '../config'
import * as selectors from './selectors'


type Browser = webdriverio.Client<void>


export interface BrowserConnection {
  beginTutorial(): Promise<VisibleGameInformation>
  beginFFAGame(): Promise<VisibleGameInformation>
  begin1v1Game(): Promise<VisibleGameInformation>
  submitOrder(order: Order | undefined, lastTurn: number): Promise<VisibleGameInformation>
  exitGameAndWaitForMainPage(): Promise<void>
  waitForGameToEndExitAndGetReplay(): Promise<string>
  close(): Promise<void>
}

export async function createBrowserConnection(): Promise<BrowserConnection> {
  const browser = webdriverio.remote(webdriverOpts).init().url(generalsIoUrl)
  await load()

  return {
    submitOrder,
    beginTutorial,
    begin1v1Game,
    beginFFAGame,
    exitGameAndWaitForMainPage,
    waitForGameToEndExitAndGetReplay,
    close,
  }

  async function load(): Promise<void> {
    await browser.setViewportSize(viewportSize, false)
    await browser.execute(addCustomStylesScript)
    await browser.execute(scrapeCurrentStateScript)
    await enterName()
  }

  async function enterName(): Promise<void> {
    await browser.setValue(selectors.nameInput, botName)
  }

  async function zoomGameOut(): Promise<void> {
    await browser.keys('9')
    await browser.keys('9')
    await browser.keys('9')
  }

  async function click(selector: string): Promise<void> {
    await browser.click(selector)
  }

  async function clickTile(tile: Tile, doubleClick?: boolean): Promise<void> {
    const selector = selectors.ofTile(tile)
    await click(selector)
    if (doubleClick) await click(selector)
  }

  async function clickExitGameButton(): Promise<void> {
    await click(selectors.exitGame)
  }

  async function clickReplayListButton(): Promise<void> {
    await click(selectors.replayList)
  }

  async function attemptToGetReplay(): Promise<string | undefined> {
    await clickReplayListButton()
    await browser.waitForVisible(selectors.replays, 1000)
    const linkPresent = await browser.isVisible(selectors.replayLink)
    if (!linkPresent) return undefined
    const replay = await browser.getAttribute(selectors.replayLink, 'href')
    await click(selectors.exitReplays)
    return replay
  }

  async function refresh(): Promise<void> {
    const refreshing = browser.refresh().then(() => true)
    const waitingTenSeconds = bluebird.delay(10 * 1000).then(() => false)
    // refreshed will be true if refreshing finished before ten seconds elapsed
    const refreshedSuccessfullyWithinTenSeconds = await bluebird.race([refreshing, waitingTenSeconds])
    // Return if the browser refreshed successfully within ten seconds
    if (refreshedSuccessfullyWithinTenSeconds) return
    // Otherwise retry
    return refresh()
  }

  async function getReplay(): Promise<string> {
    const replay = await attemptToGetReplay()
    if (replay) return replay
    await bluebird.delay(30 * 1000)
    await refresh()
    return getReplay()
  }

  async function orderHasResolved(tile: Tile): Promise<boolean> {
    return !(await browser.isExisting(selectors.ofOrderArrow(tile)))
  }

  async function waitUntil(predicate: () => Promise<boolean>, milliseconds: number = 20000): Promise<void> {
    await browser.waitUntil(predicate, milliseconds)
  }

  async function issueOrder(order: Order): Promise<void> {
    try {
      const { from, to, splitArmy } = order
      await clickTile(from, splitArmy)
      await clickTile(to)
      await waitUntil(() => orderHasResolved(from))
    } catch (err) {
      console.error(err)
    }
  }

  async function submitOrder(order: Order | undefined, lastTurn: number): Promise<VisibleGameInformation> {
    const completed = order ? issueOrder(order) : waitUntil(() => turnHasIncremented(lastTurn))
    await completed
    return scrapeCurrentState()
  }

  async function beginTutorial(): Promise<VisibleGameInformation> {
    await click(selectors.playGame)
    await waitForGameToStart()
    return scrapeCurrentState()
  }

  async function beginRegularGame(selector: string): Promise<VisibleGameInformation> {
    await click(selectors.playGame)
    await browser.waitForVisible(selectors.gameModes, 1000)
    await click(selector)
    await waitForGameToStart()
    return scrapeCurrentState()
  }

  async function beginFFAGame(): Promise<VisibleGameInformation> {
    return beginRegularGame(selectors.ffa)
  }

  async function begin1v1Game(): Promise<VisibleGameInformation> {
    return beginRegularGame(selectors.oneVsOne)
  }

  async function waitForGameToStart(): Promise<void> {
    await browser.waitForVisible(selectors.turnCounter, 2 * 60 * 1000)
    await zoomGameOut()
  }

  async function scrapeCurrentState(): Promise<VisibleGameInformation> {
    const result = await browser.execute(function(): any { return this.scrapeCurrentState() })
    return result.value as VisibleGameInformation
  }

  async function turnHasIncremented(lastTurn: number): Promise<boolean> {
    const turnCounterText = await browser.getText(selectors.turnCounter) as string
    const match = turnCounterText.match(/\d+/)
    if (!match) throw new Error('Could locate turn counter')
    return parseInt(match[0], 10) > lastTurn
  }

  async function waitForMainPage(): Promise<void> {
    await browser.waitForVisible(selectors.mainMenu, 5000)
  }

  async function exitGameAndWaitForMainPage(): Promise<void> {
    await clickExitGameButton()
    await waitForMainPage()
  }

  async function waitForGameToEndExitAndGetReplay(): Promise<string> {
    await exitGameAndWaitForMainPage()
    return getReplay()
  }

  async function close(): Promise<void> {
    try {
      await browser.close()
    } catch (err) {
      console.error(err)
    }
  }
}
