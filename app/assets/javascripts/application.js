//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {

  // Switching between read and unread
    const unreadMessages = document.querySelectorAll('#messageRead');
    unreadMessages.forEach(function(message) {
      message.addEventListener('click', function() {
        const list = message.classList
        if (!list.contains('govuk-details-message')) {
          message.classList.toggle('govuk-details-message')
          message.classList.toggle('govuk-details-message-unread')
        }
      });
    });
    
    // Dynamic styling of read/unread tag
    function updateUnreadMessagesCount() {
      // line 23 updates the message count and applied the correct styling when allUnreadMessages.length === 0, but the wrong message count is shown on the multiple businesses page
      const allMessagesTab = document.querySelector('.govuk-tabs__list-item-ffd a[href="#all-messages"]');
      // line 24 restores the All messages tab to a message count of 702, but the message count no longer updates & the correct styling isn't applied when allUnreadMessages.length === 0
      // const allMessagesTab = document.querySelector('.govuk-tabs__list-item-ffd a[href="#all-messages"], .govuk-tabs__list-item-ffd a[href=#overview]');
      const allUnreadMessages = document.querySelectorAll('.govuk-details-message-unread');
      const allReadMessages = document.querySelectorAll('.govuk-details-message');
      allMessagesTab.innerHTML = allUnreadMessages.length === 0 ? `All messages <span class="read-message">${allReadMessages.length} read</span>` : `All messages <span class="unread-message">${allUnreadMessages.length} unread</span>`
    }

    updateUnreadMessagesCount();

    const messageDetails = document.querySelectorAll('.govuk-details');
    messageDetails.forEach(function(details) {
      details.addEventListener('click', function() {
        updateUnreadMessagesCount();
      });
    });
  })