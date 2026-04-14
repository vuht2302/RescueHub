namespace RescueHub.Modules.Public.Application;

public interface IPublicService
{
    object GetBootstrap();

    object GetMapData(double lat, double lng, double radiusKm);

    object CreateSos();
}
