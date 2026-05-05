---
title: Data models
---

Our current implementation uses a relational database (Postgres).

A key data model in OCPP 2.0.1 is the device model.
In our case we modeled the database after what is returned by the charger when it gives us the base report.
Here is a diagram showing how the data is related.

```mermaid
erDiagram
    Boots {
        timestamp lastBootTime
        int heartbeatInterval
        int bootRetryInterval
        string status
        json statusInfo
        boolean getBaseReportOnPending
        json variablesRejectedOnLastBoot
        boolean bootWithRejectedVariables
        timestamp createdAt
        timestamp updatedAt
        string id PK
    }
    ChargingStations {
        boolean isOnline
        int locationId FK
        timestamp createdAt
        timestamp updatedAt
        string id PK
    }
    Components {
        string name
        string instance
        int evseDatabaseId FK
        timestamp createdAt
        timestamp updatedAt
        int id PK
    }
    Evses {
        int id PK
        int connectorId
        timestamp createdAt
        timestamp updatedAt
        int databaseId
    }
    Locations {
        string name
        geometry coordinates
        timestamp createdAt
        timestamp updatedAt
        string address
        string city
        string postalCode
        string state
        string country
        int id PK
    }
    VariableAttributes {
        string stationId FK
        string type
        string dataType
        string value
        string mutability
        boolean persistent
        boolean constant
        int variableId FK
        int componentId FK
        int evseDatabaseId FK
        timestamp createdAt
        timestamp updatedAt
        string bootConfigId FK
        timestamp generatedAt
        int id PK
    }
    Variables {
        string name
        string instance
        timestamp createdAt
        timestamp updatedAt
        int id PK
    }

    ChargingStations ||--|{ Locations : "locationId:id"
    Components ||--|{ Evses : "evseDatabaseId:databaseId"
    VariableAttributes ||--|{ Boots : "bootConfigId:id"
    VariableAttributes ||--|{ ChargingStations : "stationId:id"
    VariableAttributes ||--|{ Components : "componentId:id"
    VariableAttributes ||--|{ Evses : "evseDatabaseId:databaseId"
    VariableAttributes ||--|{ Variables : "variableId:id"
```

Here is an entity relation diagram showing all the tables.

<img src="../../assets/img/ERDiagram.svg" alt="Entity Relationship Diagram" style="max-width: 100%; height: auto;">
