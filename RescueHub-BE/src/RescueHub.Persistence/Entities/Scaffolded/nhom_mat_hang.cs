using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class nhom_mat_hang
{
    public Guid id { get; set; }

    public Guid? parent_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<nhom_mat_hang> Inverseparent { get; set; } = new List<nhom_mat_hang>();

    public virtual ICollection<mat_hang> mat_hangs { get; set; } = new List<mat_hang>();

    public virtual nhom_mat_hang? parent { get; set; }
}
