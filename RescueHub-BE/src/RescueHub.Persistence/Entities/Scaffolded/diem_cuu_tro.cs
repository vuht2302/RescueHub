using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class diem_cuu_tro
{
    public Guid id { get; set; }

    public Guid chien_dich_cuu_tro_id { get; set; }

    public string point_code { get; set; } = null!;

    public string point_name { get; set; } = null!;

    public Guid? dia_diem_id { get; set; }

    public Guid? khu_vuc_hanh_chinh_id { get; set; }

    public string? address { get; set; }

    public decimal? lat { get; set; }

    public decimal? lng { get; set; }

    public Point? geom { get; set; }

    public Guid? manager_user_id { get; set; }

    public string status_code { get; set; } = null!;

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual chien_dich_cuu_tro chien_dich_cuu_tro { get; set; } = null!;

    public virtual dia_diem? dia_diem { get; set; }

    public virtual khu_vuc_hanh_chinh? khu_vuc_hanh_chinh { get; set; }

    public virtual nguoi_dung? manager_user { get; set; }

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_tros { get; set; } = new List<phieu_cap_phat_cuu_tro>();
}
