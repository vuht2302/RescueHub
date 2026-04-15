using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class warehouse
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public Guid? admin_area_id { get; set; }

    public string address_text { get; set; } = null!;

    public Point? geom { get; set; }

    public Guid? manager_user_id { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime created_at { get; set; }

    public virtual admin_area? admin_area { get; set; }

    public virtual app_user? manager_user { get; set; }

    public virtual ICollection<relief_issue> relief_issues { get; set; } = new List<relief_issue>();

    public virtual ICollection<stock_alert> stock_alerts { get; set; } = new List<stock_alert>();

    public virtual ICollection<stock_balance> stock_balances { get; set; } = new List<stock_balance>();

    public virtual ICollection<stock_transaction> stock_transactions { get; set; } = new List<stock_transaction>();

    public virtual ICollection<warehouse_zone> warehouse_zones { get; set; } = new List<warehouse_zone>();
}
