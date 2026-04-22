# YÜK-LE API — .NET 9 (docker-compose ile tam yığın)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["Yukle.Api.csproj", "./"]
RUN dotnet restore "Yukle.Api.csproj"
COPY . .
RUN dotnet publish "Yukle.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Yukle.Api.dll"]
