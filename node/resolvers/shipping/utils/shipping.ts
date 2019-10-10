import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'

import {
  addressHasGeocoordinates,
  filterDeliveryOptions,
  getSelectedDeliveryAddress,
} from './address'
import {
  getFormattedDeliveryOptions,
  hasDeliveryOption,
} from './delivery-options'

export const getShippingData = (
  address: CheckoutAddress,
  logisticsInfo: LogisticsInfo[] | null
) => {
  const selectedAddresses = [address]
  const hasGeocoordinates = addressHasGeocoordinates(address)
  const logisticsInfoWithAddress =
    (logisticsInfo &&
      logisticsInfo.map((li: LogisticsInfo) => ({
        ...li,
        addressId: address.addressId,
      }))) ||
    []

  const requestPayload = {
    logisticsInfo: logisticsInfoWithAddress,
    selectedAddresses,
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
  }

  return requestPayload
}

export const selectDeliveryOption = ({
  shippingData,
  deliveryOptionId,
}: {
  shippingData: ShippingData
  deliveryOptionId: string
}) => {
  const logisticsInfoWithSelectedDeliveryOption = shippingData.logisticsInfo.map(
    (li: LogisticsInfo) => ({
      ...li,
      selectedSla: hasDeliveryOption(li.slas, deliveryOptionId)
        ? deliveryOptionId
        : li.selectedSla,
    })
  )

  const deliveryAddress = getSelectedDeliveryAddress(
    shippingData.selectedAddresses
  )

  return getShippingData(
    deliveryAddress!,
    logisticsInfoWithSelectedDeliveryOption
  )
}

export const getShippingInfo = (orderForm: CheckoutOrderForm) => {
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo

  const countries = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.shipsTo) : [])
  )

  const availableAddresses =
    (orderForm.shippingData && orderForm.shippingData.availableAddresses) || []

  const selectedAddress =
    orderForm.shippingData &&
    getSelectedDeliveryAddress(orderForm.shippingData.selectedAddresses)!

  const deliveryOptions = uniq(
    flatten(
      logisticsInfo ? logisticsInfo.map((item: LogisticsInfo) => item.slas) : []
    )
  )

  // Since at this time Shipping does not show Pickup Points or
  // Scheduled Delivery/Pickup Options we are filtering from results.
  // Also we will filter deliveryOptions which does not apply to all LogisticsInfo.
  const filteredDeliveryOptions = filterDeliveryOptions(
    deliveryOptions,
    logisticsInfo
  )

  const updatedDeliveryOptions = getFormattedDeliveryOptions(
    filteredDeliveryOptions,
    logisticsInfo
  )

  return {
    availableAddresses,
    countries,
    deliveryOptions: updatedDeliveryOptions,
    selectedAddress,
  }
}