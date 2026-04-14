using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class vai_tro
{
    public Guid id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? description { get; set; }

    public bool is_active { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<nguoi_dung_vai_tro> nguoi_dung_vai_tros { get; set; } = new List<nguoi_dung_vai_tro>();

    public virtual ICollection<vai_tro_quyen> vai_tro_quyens { get; set; } = new List<vai_tro_quyen>();
}
