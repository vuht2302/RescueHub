using System;
using System.Collections.Generic;
using NetTopologySuite.Geometries;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class dia_diem
{
    public Guid id { get; set; }

    public string? code { get; set; }

    public string name { get; set; } = null!;

    public string? site_type_code { get; set; }

    public string? address { get; set; }

    public Guid? khu_vuc_hanh_chinh_id { get; set; }

    public decimal? lat { get; set; }

    public decimal? lng { get; set; }

    public Point? geom { get; set; }

    public Guid? responsible_don_vi_id { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<diem_cuu_tro> diem_cuu_tros { get; set; } = new List<diem_cuu_tro>();

    public virtual ICollection<doi_cuu_ho> doi_cuu_hos { get; set; } = new List<doi_cuu_ho>();

    public virtual ICollection<kho> khos { get; set; } = new List<kho>();

    public virtual khu_vuc_hanh_chinh? khu_vuc_hanh_chinh { get; set; }

    public virtual ICollection<phuong_tien> phuong_tiens { get; set; } = new List<phuong_tien>();

    public virtual don_vi? responsible_don_vi { get; set; }
}
