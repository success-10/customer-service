from django.contrib import admin
from .models import Customer, Agent, Message, CannedResponse

# Register your models here.
admin.site.register(Customer)
admin.site.register(Agent)
admin.site.register(Message)
admin.site.register(CannedResponse)