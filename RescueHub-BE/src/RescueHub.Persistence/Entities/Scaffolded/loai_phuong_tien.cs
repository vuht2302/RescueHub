using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class loai_phuong_tien
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? vehicle_group_code { get; set; }

    public int? default_capacity_person { get; set; }

    public decimal? default_capacity_weight_kg { get; set; }

    public string? description { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<phuong_tien> phuong_tiens { get; set; } = new List<phuong_tien>();
}
