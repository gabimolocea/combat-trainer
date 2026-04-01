from django.urls import path
from . import views

urlpatterns = [
    path("partners/", views.PartnerListView.as_view(), name="partner-list"),
    path("partners/invite/", views.PartnerInviteView.as_view(), name="partner-invite"),
    path("partners/<int:pk>/accept/", views.PartnerAcceptView.as_view(), name="partner-accept"),
    path("partners/<int:pk>/decline/", views.PartnerDeclineView.as_view(), name="partner-decline"),
    path("following/", views.FollowingListView.as_view(), name="following-list"),
    path("followers/", views.FollowersListView.as_view(), name="followers-list"),
    path("follow/", views.FollowCreateView.as_view(), name="follow-create"),
    path("follow/<int:user_id>/", views.FollowDeleteView.as_view(), name="follow-delete"),
]
