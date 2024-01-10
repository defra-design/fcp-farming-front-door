//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  const element = document.getElementById('messageRead')
  element.addEventListener('click', (event) => {
    const list = element.classList
    if (!list.contains('govuk-details-message')) {
      element.classList.toggle('govuk-details-message')
      element.classList.toggle('govuk-details-message-unread')
    }
  })

  document.addEventListener("DOMContentLoaded", function() {
    function updateUnreadMessagesCount() {
      const allMessagesTab = document.querySelector('.govuk-tabs__list-item-ffd a[href="#all-messages"]');
      const allUnreadMessages = document.querySelectorAll('.govuk-details-message-unread');
      const allReadMessages = document.querySelectorAll('.govuk-details-message');

      const totalMessages = allUnreadMessages.length;

      if (allUnreadMessages.length === 0) {
        allMessagesTab.innerHTML = `All messages <span class="read-message">${allReadMessages.length} read</span>`
      } else {
        allMessagesTab.innerHTML = `All messages <span class="unread-message">${allUnreadMessages.length} unread</span>`
      }
    }

    updateUnreadMessagesCount();

    const messageDetails = document.querySelectorAll('.govuk-details');
    messageDetails.forEach(function(details) {
      details.addEventListener('click', function() {
        updateUnreadMessagesCount();
      });
    });
  });
})
