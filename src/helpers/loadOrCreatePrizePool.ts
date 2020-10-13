import { Address, BigInt } from '@graphprotocol/graph-ts'

import {
  PrizePool,
} from '../../generated/schema'

import {
  PrizePool as PrizePoolTemplate,
} from '../../generated/templates'

import {
  PrizePool as PrizePoolContract,
} from '../../generated/templates/PrizePool/PrizePool'

import {
  ControlledToken as ControlledTokenContract,
} from '../../generated/templates/ControlledToken/ControlledToken'


import { loadOrCreatePrize } from './loadOrCreatePrize'
import { prizeId } from './idTemplates'
import { ZERO, ONE } from './common'


export function loadOrCreatePrizePool(
  prizePool: Address
): PrizePool {
  let _prizePool = PrizePool.load(prizePool.toHex())

  if (!_prizePool) {
    _prizePool = new PrizePool(prizePool.toHex())
    const boundPrizePool = PrizePoolContract.bind(prizePool)

    const poolTokenAddress = boundPrizePool.token()
    const boundToken = ControlledTokenContract.bind(poolTokenAddress)

    _prizePool.owner = boundPrizePool.owner()
    _prizePool.reserve = boundPrizePool.reserve()
    _prizePool.trustedForwarder = boundPrizePool.trustedForwarder()
    _prizePool.deactivated = false

    _prizePool.reserveFeeControlledToken = boundPrizePool.reserveFeeControlledToken()

    _prizePool.underlyingCollateralToken = poolTokenAddress
    _prizePool.underlyingCollateralDecimals = BigInt.fromI32(boundToken.decimals())
    _prizePool.underlyingCollateralName = boundToken.name()
    _prizePool.underlyingCollateralSymbol = boundToken.symbol()

    _prizePool.maxExitFeeMantissa = boundPrizePool.maxExitFeeMantissa()
    _prizePool.maxTimelockDuration = boundPrizePool.maxTimelockDuration()
    _prizePool.timelockTotalSupply = boundPrizePool.timelockTotalSupply()
    _prizePool.liquidityCap = ZERO

    _prizePool.currentState = 'Opened'

    const _newPrize = loadOrCreatePrize(prizePool.toHex(), '1')
    _newPrize.save()
    _prizePool.currentPrize = prizeId(prizePool.toHex(), '1')

    _prizePool.prizesCount = ZERO
    _prizePool.playerCount = ZERO

    _prizePool.cumulativePrizeGross = ZERO
    _prizePool.cumulativePrizeReserveFee = ZERO
    _prizePool.cumulativePrizeNet = ZERO

    _prizePool.save()
    

    // Start listening for events from the dynamically generated contract
    PrizePoolTemplate.create(prizePool)
  }

  return _prizePool as PrizePool
}
