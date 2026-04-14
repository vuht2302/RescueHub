using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class muc_do_nghiem_trong
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public int sort_order { get; set; }

    public string? color_code { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<danh_gia_su_co> danh_gia_su_cos { get; set; } = new List<danh_gia_su_co>();

    public virtual ICollection<su_co> su_cos { get; set; } = new List<su_co>();
}
