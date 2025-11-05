from django.urls import path
from . import views

urlpatterns = [
    path("messages/", views.list_messages),
    path("messages/<int:message_id>/claim", views.claim_message),
    path("messages/<int:message_id>/reply", views.reply_message),
    path("canned/", views.list_canned),
    path("messages/<int:message_id>/canned", views.use_canned_reply),
]
