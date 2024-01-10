//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
  const element = document.getElementById('messageRead')
  element.addEventListener('click', (event) => {
    const list = element.classList
    if (!list.contains('govuk-details-message')) {
      element.classList.toggle('govuk-details-message')
      element.classList.toggle('govuk-details-message-unread')
    }
    updateMessageTotals()
  })
})
